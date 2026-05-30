package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"v0-project/apps/api/internal/auth"

	"github.com/gin-gonic/gin"
)

var authSvc *auth.TokenService
var userStore interface {
	FindUserByID(ctx context.Context, id string) (*auth.User, error)
}

func InitAuthMiddleware(svc *auth.TokenService) {
	authSvc = svc
}

func InitUserStore(store interface {
	FindUserByID(ctx context.Context, id string) (*auth.User, error)
}) {
	userStore = store
}

func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(strings.ToLower(header), "bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"code": 20001, "message": "unauthorized"})
			return
		}
		token := strings.TrimSpace(header[7:])
		claims, err := authTokenParser(token)
		if err != nil || claims.Type != "access" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"code": 20001, "message": "unauthorized"})
			return
		}
		if userStore != nil {
			user, err := userStore.FindUserByID(c.Request.Context(), claims.UserID)
			if err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"code": 20001, "message": "unauthorized"})
				return
			}
			if user.Status != "active" && user.Status != "suspended" {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"code": 20003, "message": "account disabled"})
				return
			}
			claims.Role = user.Role
			c.Set("user_status", user.Status)
		} else {
			c.Set("user_status", "active")
		}
		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func authTokenParser(token string) (*auth.Claims, error) {
	if authSvc == nil {
		return nil, errors.New("auth service not initialized")
	}
	return authSvc.ParseAccess(token)
}

func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		if role != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"code": 30001, "message": "forbidden"})
			return
		}
		c.Next()
	}
}

func RequireActive() gin.HandlerFunc {
	return func(c *gin.Context) {
		status := c.GetString("user_status")
		if status == "" {
			status = "active"
		}
		if status != "active" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"code": 20003, "message": "account is not active"})
			return
		}
		c.Next()
	}
}
