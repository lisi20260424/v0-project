package config

import "os"

type Config struct {
	Env            string
	Port           string
	JWTAccessKey   string
	JWTRefreshKey  string
	AccessTTLMin   string
	RefreshTTLHour string
}

func Load() Config {
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "dev"
	}
	port := os.Getenv("API_PORT")
	if port == "" {
		port = "8080"
	}
	accessKey := os.Getenv("JWT_ACCESS_SECRET")
	if accessKey == "" {
		accessKey = "replace_me_access"
	}
	refreshKey := os.Getenv("JWT_REFRESH_SECRET")
	if refreshKey == "" {
		refreshKey = "replace_me_refresh"
	}
	accessTTL := os.Getenv("JWT_ACCESS_TTL_MIN")
	if accessTTL == "" {
		accessTTL = "15"
	}
	refreshTTL := os.Getenv("JWT_REFRESH_TTL_HOUR")
	if refreshTTL == "" {
		refreshTTL = "168"
	}
	return Config{
		Env:            env,
		Port:           port,
		JWTAccessKey:   accessKey,
		JWTRefreshKey:  refreshKey,
		AccessTTLMin:   accessTTL,
		RefreshTTLHour: refreshTTL,
	}
}
