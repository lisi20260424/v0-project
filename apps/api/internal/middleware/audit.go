package middleware

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

var auditPool *pgxpool.Pool

func InitAuditDB(pool *pgxpool.Pool) {
	auditPool = pool
}

func AuditAdminWrite() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		if auditPool == nil || !isWriteMethod(c.Request.Method) || c.Writer.Status() >= http.StatusBadRequest {
			return
		}
		actorID := c.GetString("user_id")
		if actorID == "" {
			return
		}
		writeAudit(c, actorID, "admin."+c.Request.Method, "admin_api")
	}
}

func AuditAuthSensitive(action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		if auditPool == nil {
			return
		}
		writeAudit(c, c.GetString("user_id"), action, "auth_api")
	}
}

func isWriteMethod(method string) bool {
	return method == http.MethodPost || method == http.MethodPut || method == http.MethodPatch || method == http.MethodDelete
}

func writeAudit(c *gin.Context, actorID, action, targetType string) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	var actor any
	if actorID != "" {
		actor = actorID
	}
	_, err := auditPool.Exec(ctx, `
INSERT INTO audit_logs (actor_user_id, action, target_type, target_id, metadata)
VALUES ($1, $2, $3, $4, jsonb_build_object('request_id', $5::text, 'method', $6::text, 'path', $7::text, 'status', $8::int))
`, actor, action, targetType, c.FullPath(), c.GetString(requestIDKey), c.Request.Method, c.Request.URL.Path, c.Writer.Status())
	if err != nil {
		log.Printf("audit write failed request_id=%s action=%s err=%v", c.GetString(requestIDKey), action, err)
	}
}
