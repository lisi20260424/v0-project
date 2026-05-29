package tasks

import (
	"context"
	"fmt"
	"time"

	"v0-project/apps/api/internal/queue"
)

type Service struct {
	producer queue.Producer
}

type CreateTaskInput struct {
	UserID  string
	Type    string
	ModelID string
	Prompt  string
}

type Task struct {
	ID        string `json:"id"`
	UserID    string `json:"userId"`
	Type      string `json:"type"`
	ModelID   string `json:"modelId"`
	Prompt    string `json:"prompt"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt"`
}

func NewService(producer queue.Producer) *Service {
	return &Service{producer: producer}
}

func (s *Service) Create(ctx context.Context, in CreateTaskInput) (*Task, error) {
	if in.Type != "image" && in.Type != "video" && in.Type != "music" {
		return nil, fmt.Errorf("invalid task type")
	}
	if in.ModelID == "" || in.Prompt == "" || in.UserID == "" {
		return nil, fmt.Errorf("missing required fields")
	}
	id := fmt.Sprintf("tsk_%d", time.Now().UnixNano())
	task := &Task{
		ID:        id,
		UserID:    in.UserID,
		Type:      in.Type,
		ModelID:   in.ModelID,
		Prompt:    in.Prompt,
		Status:    "queued",
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}
	if err := s.producer.EnqueueGenerationTask(ctx, queue.EnqueueTaskInput{
		TaskID:  task.ID,
		Type:    task.Type,
		ModelID: task.ModelID,
		Prompt:  task.Prompt,
	}); err != nil {
		return nil, err
	}
	return task, nil
}

func (s *Service) List(_ context.Context, userID string) ([]Task, error) {
	if userID == "" {
		return nil, fmt.Errorf("missing user id")
	}
	return []Task{}, nil
}
