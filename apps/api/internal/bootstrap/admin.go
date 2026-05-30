package bootstrap

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AdminConfig struct {
	Email       string
	Password    string
	DisplayName string
}

func EnsureAdmin(ctx context.Context, pool *pgxpool.Pool, cfg AdminConfig) error {
	if pool == nil {
		return nil
	}

	email := strings.ToLower(strings.TrimSpace(cfg.Email))
	password := strings.TrimSpace(cfg.Password)
	displayName := strings.TrimSpace(cfg.DisplayName)
	if email == "" && password == "" && displayName == "" {
		return nil
	}
	if email == "" || password == "" {
		return fmt.Errorf("ADMIN_EMAIL and ADMIN_PASSWORD must be set together")
	}
	if !strings.Contains(email, "@") {
		return fmt.Errorf("ADMIN_EMAIL is invalid")
	}
	if len(password) < 8 {
		return fmt.Errorf("ADMIN_PASSWORD must be at least 8 characters")
	}
	if displayName == "" {
		displayName = strings.Split(email, "@")[0]
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash admin password: %w", err)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin admin bootstrap: %w", err)
	}
	defer tx.Rollback(ctx)

	var userID string
	var existed bool
	err = tx.QueryRow(ctx, `
INSERT INTO users (email, password_hash, role, status, email_verified_at)
VALUES ($1, $2, 'admin', 'active', now())
ON CONFLICT (email) DO UPDATE SET
  password_hash=EXCLUDED.password_hash,
  role='admin',
  status='active',
  email_verified_at=COALESCE(users.email_verified_at, now()),
  updated_at=now()
RETURNING id::text, (xmax <> 0) AS existed
`, email, string(passwordHash)).Scan(&userID, &existed)
	if err != nil {
		return fmt.Errorf("upsert admin user: %w", err)
	}

	_, err = tx.Exec(ctx, `
INSERT INTO user_profiles (user_id, display_name, points, vip_tier)
VALUES ($1, $2, 800, 'lifetime')
ON CONFLICT (user_id) DO UPDATE SET
  display_name=CASE WHEN user_profiles.display_name IS NULL OR user_profiles.display_name = '' THEN EXCLUDED.display_name ELSE user_profiles.display_name END,
  vip_tier=COALESCE(user_profiles.vip_tier, EXCLUDED.vip_tier),
  updated_at=now()
`, userID, displayName)
	if err != nil {
		return fmt.Errorf("upsert admin profile: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit admin bootstrap: %w", err)
	}

	action := "created"
	if existed {
		action = "updated"
	}
	log.Printf("admin bootstrap %s email=%s at=%s", action, email, time.Now().UTC().Format(time.RFC3339))
	return nil
}
