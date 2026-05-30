package jobs

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"v0-project/apps/worker/internal/queue"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type Store struct {
	pool   *pgxpool.Pool
	object *minio.Client
	bucket string
}

func NewStore(ctx context.Context, cfg queue.Config) (*Store, error) {
	if cfg.DatabaseURL == "" {
		return &Store{}, nil
	}
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("create postgres pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping postgres: %w", err)
	}
	store := &Store{pool: pool, bucket: cfg.StorageBucket}
	if cfg.StorageAccessKey != "" && cfg.StorageSecretKey != "" && cfg.StorageEndpoint != "" {
		useSSL, err := strconv.ParseBool(cfg.StorageUseSSL)
		if err != nil {
			pool.Close()
			return nil, fmt.Errorf("invalid STORAGE_USE_SSL: %w", err)
		}
		client, err := minio.New(cfg.StorageEndpoint, &minio.Options{Creds: credentials.NewStaticV4(cfg.StorageAccessKey, cfg.StorageSecretKey, ""), Secure: useSSL, Region: "us-east-1"})
		if err != nil {
			pool.Close()
			return nil, err
		}
		if err := ensureBucket(ctx, client, store.bucket); err != nil {
			pool.Close()
			return nil, err
		}
		store.object = client
	}
	return store, nil
}

func (s *Store) Close() {
	if s != nil && s.pool != nil {
		s.pool.Close()
	}
}

func (s *Store) MarkRunning(ctx context.Context, taskID string) error {
	if s == nil || s.pool == nil {
		return nil
	}
	_, err := s.pool.Exec(ctx, `
UPDATE generation_tasks
SET status='running', progress=10, updated_at=now()
WHERE id=$1 AND deleted_at IS NULL
`, taskID)
	return err
}

func (s *Store) MarkSuccess(ctx context.Context, taskID, kind string, result map[string]any) error {
	if s == nil || s.pool == nil {
		return nil
	}
	raw, err := json.Marshal(result)
	if err != nil {
		return err
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var userID string
	if err := tx.QueryRow(ctx, `
UPDATE generation_tasks
SET status='success', progress=100, result=$2::jsonb, updated_at=now()
WHERE id=$1 AND deleted_at IS NULL
RETURNING user_id::text
`, taskID, string(raw)).Scan(&userID); err != nil {
		return err
	}

	artifactID := fmt.Sprintf("art_%d", time.Now().UnixNano())
	provider := "local_worker"
	bucket := ""
	objectKey := ""
	mimeType := ""
	sizeBytes := int64(0)
	if s.object != nil {
		provider = "minio"
		bucket = s.bucket
		objectKey = fmt.Sprintf("%s/%s/%s.json", userID, normalizeKind(kind), taskID)
		mimeType = "application/json"
		sizeBytes = int64(len(raw))
		_, err = s.object.PutObject(ctx, bucket, objectKey, bytes.NewReader(raw), sizeBytes, minio.PutObjectOptions{ContentType: mimeType})
		if err != nil {
			return err
		}
	}
	_, err = tx.Exec(ctx, `
INSERT INTO task_artifacts (id, task_id, user_id, kind, storage_provider, bucket, object_key, mime_type, size_bytes, metadata)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
`, artifactID, taskID, userID, normalizeKind(kind), provider, bucket, objectKey, mimeType, sizeBytes, string(raw))
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
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

func (s *Store) MarkFailed(ctx context.Context, taskID string, cause error) error {
	if s == nil || s.pool == nil {
		return nil
	}
	message := "generation failed"
	if cause != nil {
		message = cause.Error()
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var userID string
	var cost int64
	var status string
	if err := tx.QueryRow(ctx, `SELECT user_id::text, cost, status FROM generation_tasks WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`, taskID).Scan(&userID, &cost, &status); err != nil {
		return err
	}
	if status != "failed" && cost > 0 {
		var balanceAfter int64
		if err := tx.QueryRow(ctx, `UPDATE user_profiles SET points=points+$2, updated_at=now() WHERE user_id=$1 RETURNING points`, userID, cost).Scan(&balanceAfter); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
INSERT INTO billing_records (id, user_id, type, direction, amount, points, points_balance_after, description, related_task_id)
VALUES ($1,$2,'refund','in',0,$3,$4,$5,$6)
ON CONFLICT (id) DO NOTHING
`, "refund_"+taskID, userID, cost, balanceAfter, "generation task refund: "+taskID, taskID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
INSERT INTO user_point_ledger (id, user_id, direction, points, balance_after, reason, related_task_id)
VALUES ($1,$2,'in',$3,$4,'generation_task_refund',$5)
ON CONFLICT (id) DO NOTHING
`, "refund_ledger_"+taskID, userID, cost, balanceAfter, taskID); err != nil {
			return err
		}
	}
	if _, err := tx.Exec(ctx, `UPDATE generation_tasks SET status='failed', error_message=$2, updated_at=now() WHERE id=$1`, taskID, message); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func normalizeKind(kind string) string {
	switch kind {
	case "image", "video", "music":
		return kind
	default:
		return "metadata"
	}
}
