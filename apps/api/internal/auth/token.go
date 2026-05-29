package auth

import (
	"fmt"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID string `json:"uid"`
	Role   string `json:"role"`
	Type   string `json:"typ"`
	jwt.RegisteredClaims
}

type TokenService struct {
	accessKey  []byte
	refreshKey []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
}

func NewTokenService(accessKey, refreshKey, accessMin, refreshHour string) (*TokenService, error) {
	accessM, err := strconv.Atoi(accessMin)
	if err != nil {
		return nil, fmt.Errorf("invalid access ttl: %w", err)
	}
	refreshH, err := strconv.Atoi(refreshHour)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh ttl: %w", err)
	}
	return &TokenService{
		accessKey:  []byte(accessKey),
		refreshKey: []byte(refreshKey),
		accessTTL:  time.Duration(accessM) * time.Minute,
		refreshTTL: time.Duration(refreshH) * time.Hour,
	}, nil
}

func (t *TokenService) SignPair(userID, role string) (string, string, error) {
	now := time.Now()
	accessClaims := Claims{
		UserID: userID,
		Role:   role,
		Type:   "access",
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(t.accessTTL)),
		},
	}
	refreshClaims := Claims{
		UserID: userID,
		Role:   role,
		Type:   "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(t.refreshTTL)),
		},
	}
	access, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(t.accessKey)
	if err != nil {
		return "", "", err
	}
	refresh, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString(t.refreshKey)
	if err != nil {
		return "", "", err
	}
	return access, refresh, nil
}

func (t *TokenService) ParseAccess(token string) (*Claims, error) {
	return t.parse(token, t.accessKey)
}

func (t *TokenService) ParseRefresh(token string) (*Claims, error) {
	return t.parse(token, t.refreshKey)
}

func (t *TokenService) parse(token string, key []byte) (*Claims, error) {
	parsed, err := jwt.ParseWithClaims(token, &Claims{}, func(_ *jwt.Token) (interface{}, error) {
		return key, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := parsed.Claims.(*Claims)
	if !ok || !parsed.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}
