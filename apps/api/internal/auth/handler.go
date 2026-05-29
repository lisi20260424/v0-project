package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

var tokens *TokenService

func InitTokenService(svc *TokenService) {
	tokens = svc
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type refreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

func Login(c *gin.Context) {
	if tokens == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50002, "message": "token service not ready"})
		return
	}
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Email == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "invalid params"})
		return
	}
	role := "user"
	if strings.HasPrefix(strings.ToLower(req.Email), "admin@") {
		role = "admin"
	}
	access, refresh, err := tokens.SignPair(req.Email, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50003, "message": "sign token failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": gin.H{"accessToken": access, "refreshToken": refresh, "user": gin.H{"id": req.Email, "email": req.Email, "role": role}}})
}

func Refresh(c *gin.Context) {
	if tokens == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50002, "message": "token service not ready"})
		return
	}
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.RefreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "invalid params"})
		return
	}
	claims, err := tokens.ParseRefresh(req.RefreshToken)
	if err != nil || claims.Type != "refresh" {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 20001, "message": "unauthorized"})
		return
	}
	access, refresh, err := tokens.SignPair(claims.UserID, claims.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50003, "message": "sign token failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": gin.H{"accessToken": access, "refreshToken": refresh}})
}

func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "ok"})
}

func Me(c *gin.Context) {
	uid, _ := c.Get("user_id")
	role, _ := c.Get("role")
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": gin.H{"id": uid, "role": role}})
}
