package handler

import (
	"context"
	"net/http"
	"time"

	"v0-project/apps/api/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

var readiness = struct {
	db        *pgxpool.Pool
	redisAddr string
	storage   *storage.Service
}{}

func InitReadiness(db *pgxpool.Pool, redisAddr string, storageSvc *storage.Service) {
	readiness.db = db
	readiness.redisAddr = redisAddr
	readiness.storage = storageSvc
}

func Healthz(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func Readyz(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	checks := gin.H{}
	ready := true
	if readiness.db != nil {
		if err := readiness.db.Ping(ctx); err != nil {
			ready = false
			checks["postgres"] = err.Error()
		} else {
			checks["postgres"] = "ok"
		}
	}
	if readiness.redisAddr != "" {
		client := redis.NewClient(&redis.Options{Addr: readiness.redisAddr})
		if err := client.Ping(ctx).Err(); err != nil {
			ready = false
			checks["redis"] = err.Error()
		} else {
			checks["redis"] = "ok"
		}
		_ = client.Close()
	}
	if readiness.storage != nil {
		if err := readiness.storage.Health(ctx); err != nil {
			ready = false
			checks["storage"] = err.Error()
		} else {
			checks["storage"] = "ok"
		}
	}
	if !ready {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not_ready", "checks": checks})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ready", "checks": checks})
}
