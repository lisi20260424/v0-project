package queue

import (
	"context"
	"encoding/json"

	"github.com/hibiken/asynq"
)

type EnqueueTaskInput struct {
	TaskID  string
	Type    string
	ModelID string
	Prompt  string
}

type Producer interface {
	EnqueueGenerationTask(ctx context.Context, in EnqueueTaskInput) error
}

type NoopProducer struct{}

func (n NoopProducer) EnqueueGenerationTask(_ context.Context, _ EnqueueTaskInput) error {
	return nil
}

type AsynqProducer struct {
	client *asynq.Client
}

func NewAsynqProducer(cfg Config) *AsynqProducer {
	return &AsynqProducer{
		client: asynq.NewClient(asynq.RedisClientOpt{Addr: cfg.RedisAddr}),
	}
}

func (p *AsynqProducer) EnqueueGenerationTask(ctx context.Context, in EnqueueTaskInput) error {
	payload, err := json.Marshal(GenerationPayload{
		TaskID:  in.TaskID,
		Type:    in.Type,
		ModelID: in.ModelID,
		Prompt:  in.Prompt,
	})
	if err != nil {
		return err
	}
	_, err = p.client.EnqueueContext(ctx, asynq.NewTask(TaskTypeGeneration, payload), asynq.Queue("default"))
	return err
}

func (p *AsynqProducer) Close() error {
	return p.client.Close()
}
