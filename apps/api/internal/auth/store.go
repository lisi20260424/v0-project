package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("not found")

type User struct {
	ID            string
	Email         string
	PasswordHash  string
	Role          string
	Status        string
	DisplayName   string
	AvatarURL     *string
	Points        int64
	VIPTier       *string
	EmailVerified bool
}

type EmailOTP struct {
	ID           string
	Email        string
	OTPHash      string
	PasswordHash string
	DisplayName  string
	Attempts     int
	ExpiresAt    time.Time
	ConsumedAt   *time.Time
	CreatedAt    time.Time
}

type Store interface {
	FindUserByEmail(ctx context.Context, email string) (*User, error)
	FindUserByID(ctx context.Context, id string) (*User, error)
	CreateEmailOTP(ctx context.Context, email, purpose, otpHash, passwordHash, displayName string, expiresAt time.Time) error
	LatestEmailOTP(ctx context.Context, email, purpose string) (*EmailOTP, error)
	CountEmailOTPsSince(ctx context.Context, email, purpose string, since time.Time) (int, error)
	IncrementOTPAttempts(ctx context.Context, id string) error
	ConsumeOTP(ctx context.Context, id string) error
	CreateUserWithProfile(ctx context.Context, email, passwordHash, displayName string) (*User, error)
	UpdatePassword(ctx context.Context, userID, passwordHash string) error
	CreateRefreshToken(ctx context.Context, userID, token string, expiresAt time.Time) error
	RefreshTokenActive(ctx context.Context, token string) (bool, error)
	RevokeRefreshToken(ctx context.Context, token string) error
	RevokeUserRefreshTokens(ctx context.Context, userID string) error
}

type PGStore struct {
	pool *pgxpool.Pool
}

func NewPGStore(pool *pgxpool.Pool) *PGStore {
	if pool == nil {
		return nil
	}
	return &PGStore{pool: pool}
}

func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func HashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func (s *PGStore) FindUserByEmail(ctx context.Context, email string) (*User, error) {
	return s.scanUser(ctx, `WHERE u.email = $1`, NormalizeEmail(email))
}

func (s *PGStore) FindUserByID(ctx context.Context, id string) (*User, error) {
	return s.scanUser(ctx, `WHERE u.id = $1`, id)
}

func (s *PGStore) scanUser(ctx context.Context, where string, args ...any) (*User, error) {
	query := `
SELECT u.id::text, u.email, u.password_hash, u.role, u.status,
       COALESCE(p.display_name, ''), p.avatar_url, COALESCE(p.points, 0), p.vip_tier,
       u.email_verified_at IS NOT NULL
FROM users u
LEFT JOIN user_profiles p ON p.user_id = u.id
` + where + ` LIMIT 1`
	var user User
	err := s.pool.QueryRow(ctx, query, args...).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.Status,
		&user.DisplayName,
		&user.AvatarURL,
		&user.Points,
		&user.VIPTier,
		&user.EmailVerified,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *PGStore) CreateEmailOTP(ctx context.Context, email, purpose, otpHash, passwordHash, displayName string, expiresAt time.Time) error {
	_, err := s.pool.Exec(ctx, `
INSERT INTO email_otps (email, purpose, otp_hash, password_hash, display_name, expires_at)
VALUES ($1, $2, $3, $4, $5, $6)
`, NormalizeEmail(email), purpose, otpHash, passwordHash, displayName, expiresAt)
	return err
}

func (s *PGStore) LatestEmailOTP(ctx context.Context, email, purpose string) (*EmailOTP, error) {
	var otp EmailOTP
	err := s.pool.QueryRow(ctx, `
SELECT id::text, email, otp_hash, COALESCE(password_hash, ''), COALESCE(display_name, ''),
       attempts, expires_at, consumed_at, created_at
FROM email_otps
WHERE email = $1 AND purpose = $2
ORDER BY created_at DESC
LIMIT 1
`, NormalizeEmail(email), purpose).Scan(
		&otp.ID,
		&otp.Email,
		&otp.OTPHash,
		&otp.PasswordHash,
		&otp.DisplayName,
		&otp.Attempts,
		&otp.ExpiresAt,
		&otp.ConsumedAt,
		&otp.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &otp, nil
}

func (s *PGStore) CountEmailOTPsSince(ctx context.Context, email, purpose string, since time.Time) (int, error) {
	var count int
	err := s.pool.QueryRow(ctx, `
SELECT count(*)
FROM email_otps
WHERE email = $1 AND purpose = $2 AND created_at >= $3
`, NormalizeEmail(email), purpose, since).Scan(&count)
	return count, err
}

func (s *PGStore) IncrementOTPAttempts(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE email_otps SET attempts = attempts + 1 WHERE id = $1`, id)
	return err
}

func (s *PGStore) ConsumeOTP(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE email_otps SET consumed_at = now() WHERE id = $1`, id)
	return err
}

func (s *PGStore) CreateUserWithProfile(ctx context.Context, email, passwordHash, displayName string) (*User, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var user User
	err = tx.QueryRow(ctx, `
INSERT INTO users (email, password_hash, role, status, email_verified_at)
VALUES ($1, $2, 'user', 'active', now())
RETURNING id::text, email, password_hash, role, status, email_verified_at IS NOT NULL
`, NormalizeEmail(email), passwordHash).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.Status,
		&user.EmailVerified,
	)
	if err != nil {
		return nil, err
	}
	_, err = tx.Exec(ctx, `
INSERT INTO user_profiles (user_id, display_name, points)
VALUES ($1, $2, 800)
`, user.ID, displayName)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	user.DisplayName = displayName
	user.Points = 800
	return &user, nil
}

func (s *PGStore) UpdatePassword(ctx context.Context, userID, passwordHash string) error {
	_, err := s.pool.Exec(ctx, `UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, userID, passwordHash)
	return err
}

func (s *PGStore) CreateRefreshToken(ctx context.Context, userID, token string, expiresAt time.Time) error {
	_, err := s.pool.Exec(ctx, `
INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
`, userID, HashToken(token), expiresAt)
	if err != nil {
		return err
	}
	_, err = s.pool.Exec(ctx, `UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1`, userID)
	return err
}

func (s *PGStore) RefreshTokenActive(ctx context.Context, token string) (bool, error) {
	var active bool
	err := s.pool.QueryRow(ctx, `
SELECT EXISTS (
  SELECT 1 FROM refresh_tokens
  WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()
)
`, HashToken(token)).Scan(&active)
	return active, err
}

func (s *PGStore) RevokeRefreshToken(ctx context.Context, token string) error {
	_, err := s.pool.Exec(ctx, `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`, HashToken(token))
	return err
}

func (s *PGStore) RevokeUserRefreshTokens(ctx context.Context, userID string) error {
	_, err := s.pool.Exec(ctx, `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, userID)
	return err
}
