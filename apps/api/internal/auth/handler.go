package auth

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"time"

	"v0-project/apps/api/internal/mail"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

var tokens *TokenService
var store Store
var mailer mail.Sender

const (
	otpCooldown      = 60 * time.Second
	otpRateWindow    = time.Hour
	otpRateMaxInHour = 5
)

func InitTokenService(svc *TokenService) {
	tokens = svc
}

func InitStore(s Store) {
	store = s
}

func InitMailer(sender mail.Sender) {
	mailer = sender
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type refreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

type logoutRequest struct {
	RefreshToken string `json:"refreshToken"`
}

type requestRegisterOTPRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName"`
}

type verifyRegisterOTPRequest struct {
	Email string `json:"email"`
	OTP   string `json:"otp"`
}

type forgotPasswordRequest struct {
	Email string `json:"email"`
}

type resetPasswordRequest struct {
	Email       string `json:"email"`
	OTP         string `json:"otp"`
	NewPassword string `json:"newPassword"`
}

type changePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
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
	if store != nil {
		user, err := store.FindUserByEmail(c.Request.Context(), req.Email)
		if errors.Is(err, ErrNotFound) || (err == nil && bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil) {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 20001, "message": "invalid email or password"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 50004, "message": "load user failed"})
			return
		}
		if user.Status != "active" {
			c.JSON(http.StatusForbidden, gin.H{"code": 20003, "message": "account disabled"})
			return
		}
		access, refresh, err := tokens.SignPair(user.ID, user.Role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 50003, "message": "sign token failed"})
			return
		}
		_ = store.CreateRefreshToken(c.Request.Context(), user.ID, refresh, time.Now().Add(tokens.refreshTTL))
		c.JSON(http.StatusOK, gin.H{"code": 0, "data": gin.H{"accessToken": access, "refreshToken": refresh, "user": userResponse(user)}})
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

func RequestRegisterOTP(c *gin.Context) {
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"code": 50010, "message": "database is not configured"})
		return
	}
	if mailer == nil {
		mailer = mail.LogSender{}
	}
	var req requestRegisterOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "invalid params"})
		return
	}
	email := NormalizeEmail(req.Email)
	if email == "" || len(req.Password) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "email is required and password must be at least 8 chars"})
		return
	}
	if _, err := store.FindUserByEmail(c.Request.Context(), email); err == nil {
		c.JSON(http.StatusConflict, gin.H{"code": 20002, "message": "email already registered"})
		return
	} else if !errors.Is(err, ErrNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50004, "message": "check user failed"})
		return
	}
	if allowed, _ := checkOTPSendAllowed(c, email, "register", false); !allowed {
		return
	}

	otp, err := generateOTP(6)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50005, "message": "generate otp failed"})
		return
	}
	otpHash, err := bcrypt.GenerateFromPassword([]byte(otp), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50006, "message": "hash otp failed"})
		return
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50007, "message": "hash password failed"})
		return
	}
	displayName := strings.TrimSpace(req.DisplayName)
	if displayName == "" {
		displayName = strings.Split(email, "@")[0]
	}
	if err := store.CreateEmailOTP(c.Request.Context(), email, "register", string(otpHash), string(passwordHash), displayName, time.Now().Add(10*time.Minute)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50008, "message": "save otp failed"})
		return
	}
	if err := mailer.SendRegisterOTP(c.Request.Context(), email, otp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50009, "message": "send otp failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "otp sent", "data": gin.H{"expiresIn": 600}})
}

func VerifyRegisterOTP(c *gin.Context) {
	if store == nil || tokens == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"code": 50010, "message": "auth service is not configured"})
		return
	}
	var req verifyRegisterOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil || NormalizeEmail(req.Email) == "" || strings.TrimSpace(req.OTP) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "invalid params"})
		return
	}
	email := NormalizeEmail(req.Email)
	otp, err := store.LatestEmailOTP(c.Request.Context(), email, "register")
	if errors.Is(err, ErrNotFound) {
		c.JSON(http.StatusBadRequest, gin.H{"code": 20004, "message": "otp not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50004, "message": "load otp failed"})
		return
	}
	if otp.ConsumedAt != nil || time.Now().After(otp.ExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"code": 20005, "message": "otp expired"})
		return
	}
	if otp.Attempts >= 5 {
		c.JSON(http.StatusTooManyRequests, gin.H{"code": 20006, "message": "too many attempts"})
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(otp.OTPHash), []byte(strings.TrimSpace(req.OTP))) != nil {
		_ = store.IncrementOTPAttempts(c.Request.Context(), otp.ID)
		c.JSON(http.StatusUnauthorized, gin.H{"code": 20007, "message": "invalid otp"})
		return
	}
	user, err := store.CreateUserWithProfile(c.Request.Context(), email, otp.PasswordHash, otp.DisplayName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50011, "message": "create user failed"})
		return
	}
	_ = store.ConsumeOTP(c.Request.Context(), otp.ID)
	access, refresh, err := tokens.SignPair(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50003, "message": "sign token failed"})
		return
	}
	_ = store.CreateRefreshToken(c.Request.Context(), user.ID, refresh, time.Now().Add(tokens.refreshTTL))
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": gin.H{"accessToken": access, "refreshToken": refresh, "user": userResponse(user)}})
}

func ForgotPassword(c *gin.Context) {
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"code": 50010, "message": "database is not configured"})
		return
	}
	if mailer == nil {
		mailer = mail.LogSender{}
	}
	var req forgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil || NormalizeEmail(req.Email) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "invalid params"})
		return
	}
	email := NormalizeEmail(req.Email)
	user, err := store.FindUserByEmail(c.Request.Context(), email)
	if err != nil && !errors.Is(err, ErrNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50004, "message": "check user failed"})
		return
	}
	if allowed, handled := checkOTPSendAllowed(c, email, "password_reset", true); !allowed {
		if !handled {
			c.JSON(http.StatusOK, gin.H{"code": 0, "message": "otp sent if account exists", "data": gin.H{"expiresIn": 600}})
		}
		return
	}

	// Avoid account enumeration: nonexistent emails receive the same public response.
	if err == nil && user.Status == "active" {
		otp, err := generateOTP(6)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 50005, "message": "generate otp failed"})
			return
		}
		otpHash, err := bcrypt.GenerateFromPassword([]byte(otp), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 50006, "message": "hash otp failed"})
			return
		}
		if err := store.CreateEmailOTP(c.Request.Context(), email, "password_reset", string(otpHash), "", "", time.Now().Add(10*time.Minute)); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 50008, "message": "save otp failed"})
			return
		}
		if err := mailer.SendPasswordResetOTP(c.Request.Context(), email, otp); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 50009, "message": "send otp failed"})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "otp sent if account exists", "data": gin.H{"expiresIn": 600}})
}

func ResetPassword(c *gin.Context) {
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"code": 50010, "message": "database is not configured"})
		return
	}
	var req resetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil || NormalizeEmail(req.Email) == "" || strings.TrimSpace(req.OTP) == "" || len(req.NewPassword) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "email, otp and new password are required"})
		return
	}
	email := NormalizeEmail(req.Email)
	user, err := store.FindUserByEmail(c.Request.Context(), email)
	if errors.Is(err, ErrNotFound) {
		c.JSON(http.StatusBadRequest, gin.H{"code": 20004, "message": "otp not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50004, "message": "load user failed"})
		return
	}
	if user.Status != "active" {
		c.JSON(http.StatusForbidden, gin.H{"code": 20003, "message": "account disabled"})
		return
	}
	otp, err := store.LatestEmailOTP(c.Request.Context(), email, "password_reset")
	if errors.Is(err, ErrNotFound) {
		c.JSON(http.StatusBadRequest, gin.H{"code": 20004, "message": "otp not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50004, "message": "load otp failed"})
		return
	}
	if otp.ConsumedAt != nil || time.Now().After(otp.ExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"code": 20005, "message": "otp expired"})
		return
	}
	if otp.Attempts >= 5 {
		c.JSON(http.StatusTooManyRequests, gin.H{"code": 20006, "message": "too many attempts"})
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(otp.OTPHash), []byte(strings.TrimSpace(req.OTP))) != nil {
		_ = store.IncrementOTPAttempts(c.Request.Context(), otp.ID)
		c.JSON(http.StatusUnauthorized, gin.H{"code": 20007, "message": "invalid otp"})
		return
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50007, "message": "hash password failed"})
		return
	}
	if err := store.UpdatePassword(c.Request.Context(), user.ID, string(passwordHash)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50012, "message": "update password failed"})
		return
	}
	_ = store.ConsumeOTP(c.Request.Context(), otp.ID)
	_ = store.RevokeUserRefreshTokens(c.Request.Context(), user.ID)
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "password reset"})
}

func ChangePassword(c *gin.Context) {
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"code": 50010, "message": "database is not configured"})
		return
	}
	userID, _ := c.Get("user_id")
	id, ok := userID.(string)
	if !ok || id == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 20001, "message": "unauthorized"})
		return
	}
	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.CurrentPassword == "" || len(req.NewPassword) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "current password and new password are required"})
		return
	}
	user, err := store.FindUserByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 20001, "message": "unauthorized"})
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 20001, "message": "invalid current password"})
		return
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50007, "message": "hash password failed"})
		return
	}
	if err := store.UpdatePassword(c.Request.Context(), user.ID, string(passwordHash)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50012, "message": "update password failed"})
		return
	}
	_ = store.RevokeUserRefreshTokens(c.Request.Context(), user.ID)
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "password changed"})
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
	if store != nil {
		active, err := store.RefreshTokenActive(c.Request.Context(), req.RefreshToken)
		if err != nil || !active {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 20001, "message": "unauthorized"})
			return
		}
		_ = store.RevokeRefreshToken(c.Request.Context(), req.RefreshToken)
	}
	access, refresh, err := tokens.SignPair(claims.UserID, claims.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50003, "message": "sign token failed"})
		return
	}
	if store != nil {
		_ = store.CreateRefreshToken(c.Request.Context(), claims.UserID, refresh, time.Now().Add(tokens.refreshTTL))
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": gin.H{"accessToken": access, "refreshToken": refresh}})
}

func Logout(c *gin.Context) {
	if store != nil {
		var req logoutRequest
		_ = c.ShouldBindJSON(&req)
		if req.RefreshToken != "" {
			claims, err := tokens.ParseRefresh(req.RefreshToken)
			uid, _ := c.Get("user_id")
			if err == nil && claims.Type == "refresh" && claims.UserID == uid {
				_ = store.RevokeRefreshToken(c.Request.Context(), req.RefreshToken)
			}
		}
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "ok"})
}

func Me(c *gin.Context) {
	uid, _ := c.Get("user_id")
	role, _ := c.Get("role")
	if store != nil {
		if id, ok := uid.(string); ok && id != "" {
			user, err := store.FindUserByID(c.Request.Context(), id)
			if err == nil {
				c.JSON(http.StatusOK, gin.H{"code": 0, "data": userResponse(user)})
				return
			}
		}
	}
	email := ""
	if s, ok := uid.(string); ok {
		email = s
	}
	userType := "normal"
	if role == "admin" {
		userType = "admin"
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": gin.H{
		"id":          uid,
		"email":       email,
		"displayName": strings.Split(email, "@")[0],
		"avatarUrl":   nil,
		"points":      800,
		"vipTier":     nil,
		"status":      "active",
		"userType":    userType,
		"role":        role,
	}})
}

func userResponse(user *User) gin.H {
	userType := "normal"
	if user.Role == "admin" {
		userType = "admin"
	}
	displayName := user.DisplayName
	if displayName == "" {
		displayName = strings.Split(user.Email, "@")[0]
	}
	return gin.H{
		"id":          user.ID,
		"email":       user.Email,
		"displayName": displayName,
		"avatarUrl":   user.AvatarURL,
		"points":      user.Points,
		"vipTier":     user.VIPTier,
		"status":      user.Status,
		"userType":    userType,
		"role":        user.Role,
	}
}

func generateOTP(length int) (string, error) {
	var b strings.Builder
	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", fmt.Errorf("random digit: %w", err)
		}
		b.WriteString(n.String())
	}
	return b.String(), nil
}

func checkOTPSendAllowed(c *gin.Context, email, purpose string, silentLimit bool) (bool, bool) {
	latest, err := store.LatestEmailOTP(c.Request.Context(), email, purpose)
	if err != nil && !errors.Is(err, ErrNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50004, "message": "load otp state failed"})
		return false, true
	}
	if err == nil {
		wait := otpCooldown - time.Since(latest.CreatedAt)
		if wait > 0 {
			if silentLimit {
				return false, false
			}
			c.JSON(http.StatusTooManyRequests, gin.H{
				"code":    20008,
				"message": "otp send too frequently",
				"data":    gin.H{"retryAfter": int(wait.Seconds()) + 1},
			})
			return false, true
		}
	}
	count, err := store.CountEmailOTPsSince(c.Request.Context(), email, purpose, time.Now().Add(-otpRateWindow))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 50004, "message": "load otp rate state failed"})
		return false, true
	}
	if count >= otpRateMaxInHour {
		if silentLimit {
			return false, false
		}
		c.JSON(http.StatusTooManyRequests, gin.H{
			"code":    20009,
			"message": "too many otp requests",
			"data":    gin.H{"retryAfter": int(otpRateWindow.Seconds())},
		})
		return false, true
	}
	return true, false
}
