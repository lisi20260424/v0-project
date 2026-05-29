package main

import (
	"log"

	"v0-project/apps/worker/internal/jobs"
	"v0-project/apps/worker/internal/queue"

	"github.com/hibiken/asynq"
)

func main() {
	cfg := queue.LoadConfig()
	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: cfg.RedisAddr},
		asynq.Config{
			Concurrency: 10,
			Queues: map[string]int{
				"critical": 3,
				"default":  6,
				"low":      1,
			},
		},
	)

	mux := asynq.NewServeMux()
	jobs.Register(mux)

	log.Printf("worker started redis=%s", cfg.RedisAddr)
	if err := srv.Run(mux); err != nil {
		log.Fatalf("worker failed: %v", err)
	}
}
