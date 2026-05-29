package jobs

import (
	"context"
	"encoding/json"
	"log"

	"v0-project/apps/worker/internal/queue"

	"github.com/hibiken/asynq"
)

func Register(mux *asynq.ServeMux) {
	mux.HandleFunc(queue.TaskTypeGeneration, handleGenerationTask)
}

func handleGenerationTask(_ context.Context, task *asynq.Task) error {
	var p queue.GenerationPayload
	if err := json.Unmarshal(task.Payload(), &p); err != nil {
		return err
	}
	log.Printf("worker processing generation task id=%s type=%s model=%s", p.TaskID, p.Type, p.ModelID)
	return nil
}
