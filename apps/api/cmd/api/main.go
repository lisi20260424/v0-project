package main

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"v0-project/apps/api/internal/admin"
	"v0-project/apps/api/internal/auth"
	"v0-project/apps/api/internal/billing"
	"v0-project/apps/api/internal/bootstrap"
	"v0-project/apps/api/internal/config"
	"v0-project/apps/api/internal/db"
	"v0-project/apps/api/internal/handler"
	"v0-project/apps/api/internal/mail"
	"v0-project/apps/api/internal/middleware"
	"v0-project/apps/api/internal/payment"
	"v0-project/apps/api/internal/server"
	"v0-project/apps/api/internal/storage"
	"v0-project/apps/api/internal/tasks"
	"v0-project/apps/api/internal/user"
)

func main() {
	cfg := config.Load()
	tokenSvc, err := auth.NewTokenService(cfg.JWTAccessKey, cfg.JWTRefreshKey, cfg.AccessTTLMin, cfg.RefreshTTLHour)
	if err != nil {
		log.Fatalf("init token service failed: %v", err)
	}
	auth.InitTokenService(tokenSvc)
	middleware.InitAuthMiddleware(tokenSvc)
	middleware.InitRateLimiter(cfg.RedisAddr)
	mailer, err := initMailer(cfg)
	if err != nil {
		log.Fatalf("init mailer failed: %v", err)
	}
	auth.InitMailer(mailer)

	pool, err := db.Connect(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("init database failed: %v", err)
	}
	if pool != nil {
		defer pool.Close()
		if err := db.RunMigrations(context.Background(), pool, cfg.MigrationsDir); err != nil {
			log.Fatalf("run database migrations failed: %v", err)
		}
		if err := bootstrap.EnsureAdmin(context.Background(), pool, bootstrap.AdminConfig{
			Email:       cfg.Admin.Email,
			Password:    cfg.Admin.Password,
			DisplayName: cfg.Admin.DisplayName,
		}); err != nil {
			log.Fatalf("bootstrap admin failed: %v", err)
		}
		authStore := auth.NewPGStore(pool)
		auth.InitStore(authStore)
		middleware.InitUserStore(authStore)
		middleware.InitAuditDB(pool)
		user.InitStore(user.NewPGStore(pool))
		admin.InitDB(pool)
		tasks.InitDB(pool)
		billing.InitDB(pool)
		payment.InitDB(pool)
		storageSvc, err := storage.NewService(context.Background(), pool, cfg.Storage)
		if err != nil {
			log.Fatalf("init storage failed: %v", err)
		}
		storage.Init(storageSvc)
		handler.InitReadiness(pool, cfg.RedisAddr, storageSvc)
		log.Printf("postgres connected")
	} else {
		handler.InitReadiness(nil, cfg.RedisAddr, nil)
		log.Printf("DATABASE_URL is empty; auth is running with development fallback login")
	}

	r := server.NewRouter()
	addr := ":" + cfg.Port
	log.Printf("api starting env=%s addr=%s ts=%s", cfg.Env, addr, time.Now().Format(time.RFC3339))
	if err := r.Run(addr); err != nil {
		log.Fatalf("api failed: %v", err)
	}
}

func initMailer(cfg config.Config) (mail.Sender, error) {
	provider := strings.ToLower(strings.TrimSpace(cfg.Mail.Provider))
	switch provider {
	case "", "log":
		log.Printf("mail provider=log")
		return mail.LogSender{}, nil
	case "smtp":
		useTLS, err := strconv.ParseBool(cfg.Mail.SMTP.UseTLS)
		if err != nil {
			return nil, fmt.Errorf("invalid SMTP_USE_TLS: %w", err)
		}
		sender, err := mail.NewSMTPSender(mail.SMTPConfig{
			Host:     cfg.Mail.SMTP.Host,
			Port:     cfg.Mail.SMTP.Port,
			Username: cfg.Mail.SMTP.Username,
			Password: cfg.Mail.SMTP.Password,
			From:     cfg.Mail.From,
			UseTLS:   useTLS,
		})
		if err != nil {
			return nil, err
		}
		log.Printf("mail provider=smtp host=%s port=%s from=%s", cfg.Mail.SMTP.Host, cfg.Mail.SMTP.Port, cfg.Mail.From)
		return sender, nil
	default:
		return nil, fmt.Errorf("unsupported MAIL_PROVIDER %q", cfg.Mail.Provider)
	}
}
