package jobs

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"v0-project/apps/worker/internal/queue"

	"github.com/hibiken/asynq"
)

type Handler struct {
	store *Store
}

func Register(mux *asynq.ServeMux, store *Store) {
	h := &Handler{store: store}
	mux.HandleFunc(queue.TaskTypeGeneration, h.handleGenerationTask)
}

func (h *Handler) handleGenerationTask(ctx context.Context, task *asynq.Task) error {
	var p queue.GenerationPayload
	if err := json.Unmarshal(task.Payload(), &p); err != nil {
		return err
	}
	log.Printf("worker processing generation task id=%s type=%s model=%s", p.TaskID, p.Type, p.ModelID)
	if err := h.store.MarkRunning(ctx, p.TaskID); err != nil {
		return err
	}

	time.Sleep(200 * time.Millisecond)
	result := map[string]any{
		"message": "generation completed by local worker",
		"taskId":  p.TaskID,
		"type":    p.Type,
		"modelId": p.ModelID,
	}
	if err := h.store.MarkSuccess(ctx, p.TaskID, p.Type, result); err != nil {
		_ = h.store.MarkFailed(ctx, p.TaskID, err)
		return err
	}
	return nil
}
