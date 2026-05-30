package main

import (
	"context"
	"log"

	"v0-project/apps/worker/internal/jobs"
	"v0-project/apps/worker/internal/queue"

	"github.com/hibiken/asynq"
)

func main() {
	cfg := queue.LoadConfig()
	store, err := jobs.NewStore(context.Background(), cfg)
	if err != nil {
		log.Fatalf("init store failed: %v", err)
	}
	defer store.Close()

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
	jobs.Register(mux, store)

	log.Printf("worker started redis=%s postgres=%t", cfg.RedisAddr, cfg.DatabaseURL != "")
	if err := srv.Run(mux); err != nil {
		log.Fatalf("worker failed: %v", err)
	}
}
