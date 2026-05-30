package storage

import (
	"context"
	"fmt"
	"net/url"
	"path"
	"strconv"
	"strings"
	"time"

	"v0-project/apps/api/internal/config"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type Service struct {
	pool         *pgxpool.Pool
	bucket       string
	internal     *minio.Client
	publicClient *minio.Client
}

type Asset struct {
	ID           string `json:"id"`
	UserID       string `json:"userId"`
	Kind         string `json:"kind"`
	Bucket       string `json:"bucket"`
	ObjectKey    string `json:"objectKey"`
	OriginalName string `json:"originalName"`
	MIMEType     string `json:"mimeType"`
	SizeBytes    int64  `json:"sizeBytes"`
	Status       string `json:"status"`
	URL          string `json:"url,omitempty"`
	CreatedAt    string `json:"createdAt"`
	UpdatedAt    string `json:"updatedAt"`
}

type PresignUploadInput struct {
	UserID    string
	Kind      string
	FileName  string
	MIMEType  string
	SizeBytes int64
}

type PresignUploadResult struct {
	Asset     Asset             `json:"asset"`
	UploadURL string            `json:"uploadUrl"`
	Method    string            `json:"method"`
	Headers   map[string]string `json:"headers"`
	ExpiresAt string            `json:"expiresAt"`
}

type CompleteUploadInput struct {
	UserID  string
	AssetID string
	Size    int64
}

func NewService(ctx context.Context, pool *pgxpool.Pool, cfg config.StorageConfig) (*Service, error) {
	if pool == nil {
		return &Service{}, nil
	}
	accessKey := cfg.AccessKey
	secretKey := cfg.SecretKey
	if accessKey == "" || secretKey == "" {
		return nil, fmt.Errorf("storage credentials are required")
	}
	useSSL, err := strconv.ParseBool(cfg.UseSSL)
	if err != nil {
		return nil, fmt.Errorf("invalid STORAGE_USE_SSL: %w", err)
	}
	internalEndpoint, internalSSL := normalizeEndpoint(cfg.Endpoint, useSSL)
	publicEndpoint, publicSSL := normalizeEndpoint(cfg.PublicEndpoint, useSSL)
	internal, err := minio.New(internalEndpoint, &minio.Options{Creds: credentials.NewStaticV4(accessKey, secretKey, ""), Secure: internalSSL})
	if err != nil {
		return nil, err
	}
	publicClient, err := minio.New(publicEndpoint, &minio.Options{Creds: credentials.NewStaticV4(accessKey, secretKey, ""), Secure: publicSSL, Region: "us-east-1"})
	if err != nil {
		return nil, err
	}
	bucket := cfg.Bucket
	if bucket == "" {
		bucket = "v0-assets"
	}
	if err := ensureBucket(ctx, internal, bucket); err != nil {
		return nil, err
	}
	return &Service{pool: pool, bucket: bucket, internal: internal, publicClient: publicClient}, nil
}

func (s *Service) PresignUpload(ctx context.Context, in PresignUploadInput) (*PresignUploadResult, error) {
	if s == nil || s.pool == nil || s.publicClient == nil {
		return nil, fmt.Errorf("storage is not configured")
	}
	if in.UserID == "" || in.FileName == "" {
		return nil, fmt.Errorf("missing required fields")
	}
	assetID := fmt.Sprintf("asset_%d", time.Now().UnixNano())
	kind := sanitizeSegment(in.Kind, "asset")
	objectKey := path.Join(in.UserID, kind, assetID+"_"+sanitizeFileName(in.FileName))
	expires := 15 * time.Minute
	headers := map[string][]string{}
	if in.MIMEType != "" {
		headers["Content-Type"] = []string{in.MIMEType}
	}
	uploadURL, err := s.publicClient.PresignedPutObject(ctx, s.bucket, objectKey, expires)
	if err != nil {
		return nil, err
	}
	asset, err := s.insertPending(ctx, Asset{ID: assetID, UserID: in.UserID, Kind: kind, Bucket: s.bucket, ObjectKey: objectKey, OriginalName: in.FileName, MIMEType: in.MIMEType, SizeBytes: in.SizeBytes})
	if err != nil {
		return nil, err
	}
	return &PresignUploadResult{Asset: *asset, UploadURL: uploadURL.String(), Method: "PUT", Headers: flattenHeaders(headers), ExpiresAt: time.Now().Add(expires).UTC().Format(time.RFC3339)}, nil
}

func (s *Service) CompleteUpload(ctx context.Context, in CompleteUploadInput) (*Asset, error) {
	if s == nil || s.pool == nil {
		return nil, fmt.Errorf("storage is not configured")
	}
	sizeExpr := "size_bytes"
	args := []any{in.AssetID, in.UserID}
	if in.Size > 0 {
		sizeExpr = "$3"
		args = append(args, in.Size)
	}
	return s.scanAssetRow(ctx, fmt.Sprintf(`
UPDATE uploaded_assets
SET status='uploaded', size_bytes=%s, updated_at=now()
WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL
RETURNING id, user_id::text, kind, bucket, object_key, original_name, mime_type, size_bytes, status, created_at, updated_at
`, sizeExpr), args...)
}

func (s *Service) GetAsset(ctx context.Context, userID, assetID string) (*Asset, error) {
	if s == nil || s.pool == nil {
		return nil, fmt.Errorf("storage is not configured")
	}
	asset, err := s.scanAssetRow(ctx, `
SELECT id, user_id::text, kind, bucket, object_key, original_name, mime_type, size_bytes, status, created_at, updated_at
FROM uploaded_assets
WHERE id=$1 AND deleted_at IS NULL
`, assetID)
	if err != nil {
		return nil, err
	}
	if asset.UserID != userID {
		return nil, fmt.Errorf("forbidden")
	}
	if asset.Status == "uploaded" && s.publicClient != nil {
		u, err := s.publicClient.PresignedGetObject(ctx, asset.Bucket, asset.ObjectKey, 15*time.Minute, url.Values{})
		if err != nil {
			return nil, err
		}
		asset.URL = u.String()
	}
	return asset, nil
}

func (s *Service) Health(ctx context.Context) error {
	if s == nil || s.pool == nil {
		return nil
	}
	if err := s.pool.Ping(ctx); err != nil {
		return err
	}
	if s.internal == nil || s.bucket == "" {
		return fmt.Errorf("storage client is not configured")
	}
	exists, err := s.internal.BucketExists(ctx, s.bucket)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("storage bucket %q does not exist", s.bucket)
	}
	return nil
}

func (s *Service) insertPending(ctx context.Context, asset Asset) (*Asset, error) {
	return s.scanAssetRow(ctx, `
INSERT INTO uploaded_assets (id, user_id, kind, bucket, object_key, original_name, mime_type, size_bytes, status)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
RETURNING id, user_id::text, kind, bucket, object_key, original_name, mime_type, size_bytes, status, created_at, updated_at
`, asset.ID, asset.UserID, asset.Kind, asset.Bucket, asset.ObjectKey, asset.OriginalName, asset.MIMEType, asset.SizeBytes)
}

func (s *Service) scanAssetRow(ctx context.Context, sql string, args ...any) (*Asset, error) {
	var asset Asset
	var createdAt time.Time
	var updatedAt time.Time
	err := s.pool.QueryRow(ctx, sql, args...).Scan(&asset.ID, &asset.UserID, &asset.Kind, &asset.Bucket, &asset.ObjectKey, &asset.OriginalName, &asset.MIMEType, &asset.SizeBytes, &asset.Status, &createdAt, &updatedAt)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("asset not found")
	}
	if err != nil {
		return nil, err
	}
	asset.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	asset.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return &asset, nil
}

func ensureBucket(ctx context.Context, client *minio.Client, bucket string) error {
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	return client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{})
}

func normalizeEndpoint(raw string, fallbackSSL bool) (string, bool) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "minio:9000", fallbackSSL
	}
	if strings.HasPrefix(trimmed, "http://") || strings.HasPrefix(trimmed, "https://") {
		u, err := url.Parse(trimmed)
		if err == nil && u.Host != "" {
			return u.Host, u.Scheme == "https"
		}
	}
	return trimmed, fallbackSSL
}

func sanitizeSegment(value, fallback string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" {
		return fallback
	}
	value = strings.ReplaceAll(value, "\\", "-")
	value = strings.ReplaceAll(value, "/", "-")
	return value
}

func sanitizeFileName(value string) string {
	value = path.Base(strings.ReplaceAll(value, "\\", "/"))
	value = strings.TrimSpace(value)
	if value == "" || value == "." || value == "/" {
		return "upload.bin"
	}
	return strings.ReplaceAll(value, " ", "_")
}

func flattenHeaders(headers map[string][]string) map[string]string {
	out := map[string]string{}
	for key, values := range headers {
		if len(values) > 0 {
			out[key] = values[0]
		}
	}
	return out
}
