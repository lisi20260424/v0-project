package main

import (
	"log"
	"time"

	"v0-project/apps/api/internal/auth"
	"v0-project/apps/api/internal/config"
	"v0-project/apps/api/internal/middleware"
	"v0-project/apps/api/internal/server"
)

func main() {
	cfg := config.Load()
	tokenSvc, err := auth.NewTokenService(cfg.JWTAccessKey, cfg.JWTRefreshKey, cfg.AccessTTLMin, cfg.RefreshTTLHour)
	if err != nil {
		log.Fatalf("init token service failed: %v", err)
	}
	auth.InitTokenService(tokenSvc)
	middleware.InitAuthMiddleware(tokenSvc)

	r := server.NewRouter()
	addr := ":" + cfg.Port
	log.Printf("api starting env=%s addr=%s ts=%s", cfg.Env, addr, time.Now().Format(time.RFC3339))
	if err := r.Run(addr); err != nil {
		log.Fatalf("api failed: %v", err)
	}
}
