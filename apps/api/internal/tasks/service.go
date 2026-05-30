package tasks

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"sync"
	"time"

	"v0-project/apps/api/internal/queue"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound  = errors.New("task not found")
	ErrForbidden = errors.New("forbidden")
)

type Service struct {
	producer queue.Producer
	pool     *pgxpool.Pool
	mu       sync.RWMutex
	tasks    map[string]*Task
}

var taskPool *pgxpool.Pool

func InitDB(pool *pgxpool.Pool) {
	taskPool = pool
}

type CreateTaskInput struct {
	UserID  string
	Type    string
	ModelID string
	Prompt  string
}

type Task struct {
	ID           string         `json:"id"`
	UserID       string         `json:"userId"`
	Type         string         `json:"type"`
	ModelID      string         `json:"modelId"`
	ModelName    string         `json:"model_name,omitempty"`
	ToolLabel    string         `json:"tool_label,omitempty"`
	Prompt       string         `json:"prompt"`
	Status       string         `json:"status"`
	Progress     int            `json:"progress"`
	Cost         int            `json:"cost"`
	Result       map[string]any `json:"result,omitempty"`
	ErrorMessage string         `json:"error_message,omitempty"`
	CreatedAt    string         `json:"createdAt"`
	CreatedAtSQL string         `json:"created_at"`
	UpdatedAt    string         `json:"updated_at,omitempty"`
}

func NewService(producer queue.Producer) *Service {
	if producer == nil {
		producer = queue.NoopProducer{}
	}
	return &Service{producer: producer, pool: taskPool, tasks: map[string]*Task{}}
}

func (s *Service) Create(ctx context.Context, in CreateTaskInput) (*Task, error) {
	if in.Type != "image" && in.Type != "video" && in.Type != "music" {
		return nil, fmt.Errorf("invalid task type")
	}
	if in.ModelID == "" || in.Prompt == "" || in.UserID == "" {
		return nil, fmt.Errorf("missing required fields")
	}
	if s.pool != nil {
		return s.dbCreate(ctx, in)
	}
	id := fmt.Sprintf("tsk_%d", time.Now().UnixNano())
	now := time.Now().UTC().Format(time.RFC3339)
	task := &Task{
		ID:           id,
		UserID:       in.UserID,
		Type:         in.Type,
		ModelID:      in.ModelID,
		Prompt:       in.Prompt,
		Status:       "queued",
		Result:       map[string]any{},
		CreatedAt:    now,
		CreatedAtSQL: now,
		UpdatedAt:    now,
	}
	if err := s.producer.EnqueueGenerationTask(ctx, queue.EnqueueTaskInput{
		TaskID:  task.ID,
		Type:    task.Type,
		ModelID: task.ModelID,
		Prompt:  task.Prompt,
	}); err != nil {
		return nil, err
	}
	s.mu.Lock()
	s.tasks[id] = task
	s.mu.Unlock()
	copy := *task
	return &copy, nil
}

func (s *Service) List(ctx context.Context, userID string) ([]Task, error) {
	if userID == "" {
		return nil, fmt.Errorf("missing user id")
	}
	if s.pool != nil {
		return s.dbList(ctx, userID)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	items := make([]Task, 0)
	for _, task := range s.tasks {
		if task.UserID == userID {
			items = append(items, *task)
		}
	}
	sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt > items[j].CreatedAt })
	return items, nil
}

func (s *Service) Get(ctx context.Context, userID, taskID string) (*Task, error) {
	if userID == "" || taskID == "" {
		return nil, fmt.Errorf("missing required fields")
	}
	if s.pool != nil {
		return s.dbGet(ctx, userID, taskID)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	task, ok := s.tasks[taskID]
	if !ok {
		return nil, ErrNotFound
	}
	if task.UserID != userID {
		return nil, ErrForbidden
	}
	copy := *task
	return &copy, nil
}

func (s *Service) Delete(ctx context.Context, userID, taskID string) error {
	if userID == "" || taskID == "" {
		return fmt.Errorf("missing required fields")
	}
	if s.pool != nil {
		return s.dbDelete(ctx, userID, taskID)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	task, ok := s.tasks[taskID]
	if !ok {
		return ErrNotFound
	}
	if task.UserID != userID {
		return ErrForbidden
	}
	delete(s.tasks, taskID)
	return nil
}

func (s *Service) dbCreate(ctx context.Context, in CreateTaskInput) (*Task, error) {
	id := fmt.Sprintf("tsk_%d", time.Now().UnixNano())
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var cost int64
	_ = tx.QueryRow(ctx, `SELECT COALESCE(cost_per_use,0) FROM admin_models WHERE id=$1 AND enabled=true`, in.ModelID).Scan(&cost)
	var balanceAfter int64
	if cost > 0 {
		err = tx.QueryRow(ctx, `
UPDATE user_profiles
SET points = points - $2, updated_at = now()
WHERE user_id=$1 AND points >= $2
RETURNING points
`, in.UserID, cost).Scan(&balanceAfter)
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("insufficient points")
		}
		if err != nil {
			return nil, err
		}
	} else {
		_ = tx.QueryRow(ctx, `SELECT COALESCE(points,0) FROM user_profiles WHERE user_id=$1`, in.UserID).Scan(&balanceAfter)
	}

	task, err := scanTask(tx.QueryRow(ctx, `
INSERT INTO generation_tasks (id, user_id, type, model_id, prompt, status)
VALUES ($1, $2, $3, $4, $5, 'queued')
RETURNING id, user_id::text, type, model_id, prompt, status, progress, cost, result, COALESCE(error_message, ''), created_at, updated_at
`, id, in.UserID, in.Type, in.ModelID, in.Prompt))
	if err != nil {
		return nil, err
	}
	if cost > 0 {
		task.Cost = int(cost)
		_, err = tx.Exec(ctx, `UPDATE generation_tasks SET cost=$2 WHERE id=$1`, task.ID, cost)
		if err != nil {
			return nil, err
		}
		_, err = tx.Exec(ctx, `
INSERT INTO billing_records (id, user_id, type, direction, amount, points, points_balance_after, description, related_task_id)
VALUES ($1,$2,'consumption','out',0,$3,$4,$5,$6)
`, "bill_"+task.ID, in.UserID, cost, balanceAfter, "generation task: "+task.ID, task.ID)
		if err != nil {
			return nil, err
		}
		_, err = tx.Exec(ctx, `
INSERT INTO user_point_ledger (id, user_id, direction, points, balance_after, reason, related_task_id)
VALUES ($1,$2,'out',$3,$4,'generation_task',$5)
`, "ledger_"+task.ID, in.UserID, cost, balanceAfter, task.ID)
		if err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	if err := s.producer.EnqueueGenerationTask(ctx, queue.EnqueueTaskInput{
		TaskID:  task.ID,
		Type:    task.Type,
		ModelID: task.ModelID,
		Prompt:  task.Prompt,
	}); err != nil {
		_ = s.dbFailAndRefund(ctx, task.ID, err.Error())
		return nil, err
	}
	return task, nil
}

func (s *Service) dbFailAndRefund(ctx context.Context, taskID, message string) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var userID string
	var cost int64
	var status string
	err = tx.QueryRow(ctx, `SELECT user_id::text, cost, status FROM generation_tasks WHERE id=$1 FOR UPDATE`, taskID).Scan(&userID, &cost, &status)
	if err != nil {
		return err
	}
	if status == "failed" || cost <= 0 {
		_, err = tx.Exec(ctx, `UPDATE generation_tasks SET status='failed', error_message=$2, updated_at=now() WHERE id=$1`, taskID, message)
		if err != nil {
			return err
		}
		return tx.Commit(ctx)
	}
	var balanceAfter int64
	if err := tx.QueryRow(ctx, `UPDATE user_profiles SET points=points+$2, updated_at=now() WHERE user_id=$1 RETURNING points`, userID, cost).Scan(&balanceAfter); err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
INSERT INTO billing_records (id, user_id, type, direction, amount, points, points_balance_after, description, related_task_id)
VALUES ($1,$2,'refund','in',0,$3,$4,$5,$6)
ON CONFLICT (id) DO NOTHING
`, "refund_"+taskID, userID, cost, balanceAfter, "generation task refund: "+taskID, taskID)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
INSERT INTO user_point_ledger (id, user_id, direction, points, balance_after, reason, related_task_id)
VALUES ($1,$2,'in',$3,$4,'generation_task_refund',$5)
ON CONFLICT (id) DO NOTHING
`, "refund_ledger_"+taskID, userID, cost, balanceAfter, taskID)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `UPDATE generation_tasks SET status='failed', error_message=$2, updated_at=now() WHERE id=$1`, taskID, message)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (s *Service) dbList(ctx context.Context, userID string) ([]Task, error) {
	rows, err := s.pool.Query(ctx, `
SELECT id, user_id::text, type, model_id, prompt, status, progress, cost, result, COALESCE(error_message, ''), created_at, updated_at
FROM generation_tasks
WHERE user_id=$1 AND deleted_at IS NULL
ORDER BY created_at DESC
`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Task
	for rows.Next() {
		task, err := scanTask(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *task)
	}
	return out, rows.Err()
}

func (s *Service) dbGet(ctx context.Context, userID, taskID string) (*Task, error) {
	task, err := s.scanTaskRow(ctx, `
SELECT id, user_id::text, type, model_id, prompt, status, progress, cost, result, COALESCE(error_message, ''), created_at, updated_at
FROM generation_tasks
WHERE id=$1 AND deleted_at IS NULL
`, taskID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if task.UserID != userID {
		return nil, ErrForbidden
	}
	return task, nil
}

func (s *Service) dbDelete(ctx context.Context, userID, taskID string) error {
	tag, err := s.pool.Exec(ctx, `
UPDATE generation_tasks
SET deleted_at=now(), updated_at=now()
WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL
`, taskID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		var exists bool
		if err := s.pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM generation_tasks WHERE id=$1 AND deleted_at IS NULL)`, taskID).Scan(&exists); err != nil {
			return err
		}
		if exists {
			return ErrForbidden
		}
		return ErrNotFound
	}
	return nil
}

func (s *Service) scanTaskRow(ctx context.Context, sql string, args ...any) (*Task, error) {
	return scanTask(s.pool.QueryRow(ctx, sql, args...))
}

type taskScanner interface {
	Scan(dest ...any) error
}

func scanTask(row taskScanner) (*Task, error) {
	var task Task
	var createdAt time.Time
	var updatedAt time.Time
	if err := row.Scan(
		&task.ID,
		&task.UserID,
		&task.Type,
		&task.ModelID,
		&task.Prompt,
		&task.Status,
		&task.Progress,
		&task.Cost,
		&task.Result,
		&task.ErrorMessage,
		&createdAt,
		&updatedAt,
	); err != nil {
		return nil, err
	}
	task.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	task.CreatedAtSQL = task.CreatedAt
	task.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	if task.Result == nil {
		task.Result = map[string]any{}
	}
	return &task, nil
}
