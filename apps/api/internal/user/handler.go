package user

import (
	"context"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var store Store

func InitStore(s Store) {
	store = s
}

type Store interface {
	GetProfile(ctx context.Context, userID string) (*Profile, error)
	UpdateProfile(ctx context.Context, userID string, input ProfileInput) (*Profile, error)
	GetPreferences(ctx context.Context, userID string) (*Preferences, error)
	UpdatePreferences(ctx context.Context, userID string, input PreferencesInput) (*Preferences, error)
	GetSecurity(ctx context.Context, userID string) (*Security, error)
	DeleteAccount(ctx context.Context, userID string) error
	GetPoints(ctx context.Context, userID string) (int64, error)
	ListConsumption(ctx context.Context, userID string, page, pageSize int) (ConsumptionResult, error)
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

type Profile struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
	AvatarURL   string `json:"avatarUrl"`
	Bio         string `json:"bio"`
	Location    string `json:"location"`
	Website     string `json:"website"`
}

type ProfileInput struct {
	DisplayName string `json:"displayName"`
	AvatarURL   string `json:"avatarUrl"`
	Bio         string `json:"bio"`
	Location    string `json:"location"`
	Website     string `json:"website"`
}

type Preferences struct {
	UserID            string `json:"userId"`
	DefaultVideoModel string `json:"defaultVideoModel"`
	DefaultImageModel string `json:"defaultImageModel"`
	DefaultRatio      string `json:"defaultRatio"`
	Language          string `json:"language"`
	Theme             string `json:"theme"`
	NotifyEmail       bool   `json:"notifyEmail"`
	NotifySMS         bool   `json:"notifySms"`
	NotifyInbox       bool   `json:"notifyInbox"`
}

type PreferencesInput Preferences

type Security struct {
	UserID         string  `json:"userId"`
	Email          string  `json:"email"`
	Status         string  `json:"status"`
	Role           string  `json:"role"`
	EmailVerified  bool    `json:"emailVerified"`
	ActiveSessions int     `json:"activeSessions"`
	CreatedAt      string  `json:"createdAt"`
	LastLoginAt    *string `json:"lastLoginAt"`
	UpdatedAt      string  `json:"updatedAt"`
}

type ConsumptionRecord struct {
	ID           string  `json:"id"`
	Type         string  `json:"type"`
	ToolLabel    string  `json:"tool_label"`
	Cost         int64   `json:"cost"`
	Status       string  `json:"status"`
	CreatedAt    string  `json:"created_at"`
	CompletedAt  *string `json:"completed_at"`
	ErrorMessage *string `json:"error_message"`
}

type ConsumptionResult struct {
	Data       []ConsumptionRecord `json:"data"`
	Total      int                 `json:"total"`
	Page       int                 `json:"page"`
	PageSize   int                 `json:"pageSize"`
	TotalPages int                 `json:"totalPages"`
}

type Handler struct{}

func NewHandler() *Handler { return &Handler{} }

func (s *PGStore) GetProfile(ctx context.Context, userID string) (*Profile, error) {
	if err := s.ensureProfile(ctx, userID); err != nil {
		return nil, err
	}
	var p Profile
	err := s.pool.QueryRow(ctx, `
SELECT u.id::text, u.email, COALESCE(p.display_name, ''), COALESCE(p.avatar_url, ''),
       COALESCE(p.bio, ''), COALESCE(p.location, ''), COALESCE(p.website, '')
FROM users u
JOIN user_profiles p ON p.user_id = u.id
WHERE u.id = $1
`, userID).Scan(&p.ID, &p.Email, &p.DisplayName, &p.AvatarURL, &p.Bio, &p.Location, &p.Website)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, pgx.ErrNoRows
	}
	return &p, err
}

func (s *PGStore) UpdateProfile(ctx context.Context, userID string, input ProfileInput) (*Profile, error) {
	if err := s.ensureProfile(ctx, userID); err != nil {
		return nil, err
	}
	_, err := s.pool.Exec(ctx, `
UPDATE user_profiles
SET display_name = $2, avatar_url = $3, bio = $4, location = $5, website = $6, updated_at = now()
WHERE user_id = $1
`, userID, input.DisplayName, input.AvatarURL, input.Bio, input.Location, input.Website)
	if err != nil {
		return nil, err
	}
	return s.GetProfile(ctx, userID)
}

func (s *PGStore) GetPreferences(ctx context.Context, userID string) (*Preferences, error) {
	if err := s.ensurePreferences(ctx, userID); err != nil {
		return nil, err
	}
	var p Preferences
	err := s.pool.QueryRow(ctx, `
SELECT user_id::text, default_video_model, default_image_model, default_ratio, language, theme,
       notify_email, notify_sms, notify_inbox
FROM user_preferences
WHERE user_id = $1
`, userID).Scan(&p.UserID, &p.DefaultVideoModel, &p.DefaultImageModel, &p.DefaultRatio, &p.Language, &p.Theme, &p.NotifyEmail, &p.NotifySMS, &p.NotifyInbox)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, pgx.ErrNoRows
	}
	return &p, err
}

func (s *PGStore) UpdatePreferences(ctx context.Context, userID string, input PreferencesInput) (*Preferences, error) {
	if err := s.ensurePreferences(ctx, userID); err != nil {
		return nil, err
	}
	_, err := s.pool.Exec(ctx, `
UPDATE user_preferences
SET default_video_model = $2, default_image_model = $3, default_ratio = $4, language = $5, theme = $6,
    notify_email = $7, notify_sms = $8, notify_inbox = $9, updated_at = now()
WHERE user_id = $1
`, userID, normalizeDefault(input.DefaultVideoModel, "model_veo_video"), normalizeDefault(input.DefaultImageModel, "model_gpt_image"),
		normalizeDefault(input.DefaultRatio, "16:9"), normalizeDefault(input.Language, "zh-CN"), normalizeDefault(input.Theme, "light"),
		input.NotifyEmail, input.NotifySMS, input.NotifyInbox)
	if err != nil {
		return nil, err
	}
	return s.GetPreferences(ctx, userID)
}

func (s *PGStore) GetSecurity(ctx context.Context, userID string) (*Security, error) {
	var sec Security
	var lastLoginAt *time.Time
	var createdAt time.Time
	var updatedAt time.Time
	err := s.pool.QueryRow(ctx, `
SELECT u.id::text, u.email, u.status, u.role, u.email_verified_at IS NOT NULL,
       COUNT(rt.id) FILTER (WHERE rt.revoked_at IS NULL AND rt.expires_at > now())::int,
       u.created_at, u.last_login_at, u.updated_at
FROM users u
LEFT JOIN refresh_tokens rt ON rt.user_id = u.id
WHERE u.id = $1
GROUP BY u.id
`, userID).Scan(&sec.UserID, &sec.Email, &sec.Status, &sec.Role, &sec.EmailVerified, &sec.ActiveSessions, &createdAt, &lastLoginAt, &updatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, pgx.ErrNoRows
	}
	if err != nil {
		return nil, err
	}
	sec.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	sec.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	if lastLoginAt != nil {
		value := lastLoginAt.UTC().Format(time.RFC3339)
		sec.LastLoginAt = &value
	}
	return &sec, nil
}

func (s *PGStore) DeleteAccount(ctx context.Context, userID string) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	tag, err := tx.Exec(ctx, `
UPDATE users
SET status = 'deleted', deleted_at = now(), updated_at = now()
WHERE id = $1 AND status <> 'deleted'
`, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	if _, err := tx.Exec(ctx, `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, userID); err != nil {
		log.Printf("delete account revoke refresh tokens failed user_id=%s err=%v", userID, err)
		return err
	}
	if _, err := tx.Exec(ctx, `
INSERT INTO audit_logs (actor_user_id, action, target_type, target_id)
VALUES ($1, 'account.delete', 'user', $2)
`, userID, userID); err != nil {
		log.Printf("delete account audit log failed user_id=%s err=%v", userID, err)
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		log.Printf("delete account commit failed user_id=%s err=%v", userID, err)
		return err
	}
	return nil
}

func (s *PGStore) GetPoints(ctx context.Context, userID string) (int64, error) {
	if err := s.ensureProfile(ctx, userID); err != nil {
		return 0, err
	}
	var points int64
	err := s.pool.QueryRow(ctx, `SELECT COALESCE(points,0) FROM user_profiles WHERE user_id=$1`, userID).Scan(&points)
	return points, err
}

func (s *PGStore) ListConsumption(ctx context.Context, userID string, page, pageSize int) (ConsumptionResult, error) {
	if page < 1 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}
	var total int
	if err := s.pool.QueryRow(ctx, `
SELECT COUNT(*)
FROM billing_records b
WHERE b.user_id=$1 AND b.type='consumption'
`, userID).Scan(&total); err != nil {
		return ConsumptionResult{}, err
	}
	offset := (page - 1) * pageSize
	rows, err := s.pool.Query(ctx, `
SELECT b.id,
       COALESCE(t.type, 'generation') AS type,
       COALESCE(NULLIF(m.name, ''), NULLIF(t.model_id, ''), 'Generation') AS tool_label,
       b.points,
       COALESCE(t.status, 'success') AS status,
       b.created_at,
       CASE WHEN t.status IN ('success','failed') THEN t.updated_at ELSE NULL END AS completed_at,
       NULLIF(COALESCE(t.error_message, ''), '') AS error_message
FROM billing_records b
LEFT JOIN generation_tasks t ON t.id = b.related_task_id
LEFT JOIN admin_models m ON m.id = t.model_id
WHERE b.user_id=$1 AND b.type='consumption'
ORDER BY b.created_at DESC
LIMIT $2 OFFSET $3
`, userID, pageSize, offset)
	if err != nil {
		return ConsumptionResult{}, err
	}
	defer rows.Close()
	result := ConsumptionResult{Data: []ConsumptionRecord{}, Total: total, Page: page, PageSize: pageSize}
	result.TotalPages = (total + pageSize - 1) / pageSize
	if result.TotalPages == 0 {
		result.TotalPages = 1
	}
	for rows.Next() {
		var record ConsumptionRecord
		var createdAt time.Time
		var completedAt *time.Time
		if err := rows.Scan(&record.ID, &record.Type, &record.ToolLabel, &record.Cost, &record.Status, &createdAt, &completedAt, &record.ErrorMessage); err != nil {
			return ConsumptionResult{}, err
		}
		record.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		if completedAt != nil {
			value := completedAt.UTC().Format(time.RFC3339)
			record.CompletedAt = &value
		}
		result.Data = append(result.Data, record)
	}
	return result, rows.Err()
}

func (s *PGStore) ensureProfile(ctx context.Context, userID string) error {
	_, err := s.pool.Exec(ctx, `
INSERT INTO user_profiles (user_id, display_name)
SELECT id, split_part(email, '@', 1)
FROM users
WHERE id = $1
ON CONFLICT (user_id) DO NOTHING
`, userID)
	return err
}

func (s *PGStore) ensurePreferences(ctx context.Context, userID string) error {
	_, err := s.pool.Exec(ctx, `
INSERT INTO user_preferences (user_id)
SELECT id FROM users WHERE id = $1
ON CONFLICT (user_id) DO NOTHING
`, userID)
	return err
}

func (h *Handler) GetProfile(c *gin.Context) {
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"code": 50010, "message": "database is not configured"})
		return
	}
	userID, ok := currentUserID(c)
	if !ok {
		return
	}
	profile, err := store.GetProfile(c.Request.Context(), userID)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"code": 20010, "message": "user not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50020, "message": "load profile failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": profile})
}

func (h *Handler) UpdateProfile(c *gin.Context) {
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"code": 50010, "message": "database is not configured"})
		return
	}
	userID, ok := currentUserID(c)
	if !ok {
		return
	}
	var input ProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "invalid params"})
		return
	}
	input = sanitizeProfile(input)
	profile, err := store.UpdateProfile(c.Request.Context(), userID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50021, "message": "update profile failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": profile})
}

func (h *Handler) GetPreferences(c *gin.Context) {
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"code": 50010, "message": "database is not configured"})
		return
	}
	userID, ok := currentUserID(c)
	if !ok {
		return
	}
	preferences, err := store.GetPreferences(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50022, "message": "load preferences failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": preferences})
}

func (h *Handler) GetSecurity(c *gin.Context) {
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"code": 50010, "message": "database is not configured"})
		return
	}
	userID, ok := currentUserID(c)
	if !ok {
		return
	}
	security, err := store.GetSecurity(c.Request.Context(), userID)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"code": 20010, "message": "user not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50024, "message": "load security failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": security})
}

func (h *Handler) UpdatePreferences(c *gin.Context) {
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"code": 50010, "message": "database is not configured"})
		return
	}
	userID, ok := currentUserID(c)
	if !ok {
		return
	}
	var input PreferencesInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "invalid params"})
		return
	}
	preferences, err := store.UpdatePreferences(c.Request.Context(), userID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50023, "message": "update preferences failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": preferences})
}

func (h *Handler) Points(c *gin.Context) {
	if store != nil {
		userID, ok := currentUserID(c)
		if !ok {
			return
		}
		points, err := store.GetPoints(c.Request.Context(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 50026, "message": "load points failed"})
			return
		}
		if c.Query("type") == "stats" {
			c.JSON(http.StatusOK, gin.H{"initialPoints": points, "available": points, "used": 0})
			return
		}
		c.JSON(http.StatusOK, gin.H{"points": points})
		return
	}
	if c.Query("type") == "stats" {
		c.JSON(http.StatusOK, gin.H{"initialPoints": 1000, "available": 800, "used": 200})
		return
	}
	c.JSON(http.StatusOK, gin.H{"points": 800})
}

func (h *Handler) Consumption(c *gin.Context) {
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"code": 50010, "message": "database is not configured"})
		return
	}
	userID, ok := currentUserID(c)
	if !ok {
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	if pageSize <= 0 {
		pageSize = 20
	}
	result, err := store.ListConsumption(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50027, "message": "load consumption failed"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *Handler) DeleteAccount(c *gin.Context) {
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"code": 50010, "message": "database is not configured"})
		return
	}
	userID, ok := currentUserID(c)
	if !ok {
		return
	}
	if err := store.DeleteAccount(c.Request.Context(), userID); errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"code": 20010, "message": "user not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50025, "message": "delete account failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "account deleted",
		"data": gin.H{
			"userId":  userID,
			"deleted": true,
		},
	})
}

func currentUserID(c *gin.Context) (string, bool) {
	uid, _ := c.Get("user_id")
	id, ok := uid.(string)
	if !ok || id == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 20001, "message": "unauthorized"})
		return "", false
	}
	return id, true
}

func sanitizeProfile(input ProfileInput) ProfileInput {
	input.DisplayName = truncate(strings.TrimSpace(input.DisplayName), 48)
	input.AvatarURL = truncate(strings.TrimSpace(input.AvatarURL), 512)
	input.Bio = truncate(strings.TrimSpace(input.Bio), 500)
	input.Location = truncate(strings.TrimSpace(input.Location), 80)
	input.Website = truncate(strings.TrimSpace(input.Website), 512)
	return input
}

func normalizeDefault(value, fallback string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}
	return value
}

func truncate(value string, max int) string {
	if len([]rune(value)) <= max {
		return value
	}
	return string([]rune(value)[:max])
}
