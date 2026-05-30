package config

import "os"

type Config struct {
	Env            string
	Port           string
	JWTAccessKey   string
	JWTRefreshKey  string
	AccessTTLMin   string
	RefreshTTLHour string
	DatabaseURL    string
	MigrationsDir  string
	RedisAddr      string
	Admin          AdminConfig
	Mail           MailConfig
	Storage        StorageConfig
}

type AdminConfig struct {
	Email       string
	Password    string
	DisplayName string
}

type StorageConfig struct {
	Endpoint       string
	PublicEndpoint string
	AccessKey      string
	SecretKey      string
	Bucket         string
	UseSSL         string
}

type MailConfig struct {
	Provider string
	From     string
	SMTP     SMTPConfig
}

type SMTPConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	UseTLS   string
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
	databaseURL := os.Getenv("DATABASE_URL")
	migrationsDir := os.Getenv("DB_MIGRATIONS_DIR")
	if migrationsDir == "" {
		migrationsDir = "../../packages/db/migrations"
	}
	mailProvider := os.Getenv("MAIL_PROVIDER")
	if mailProvider == "" {
		mailProvider = "log"
	}
	smtpPort := os.Getenv("SMTP_PORT")
	if smtpPort == "" {
		smtpPort = "587"
	}
	smtpUseTLS := os.Getenv("SMTP_USE_TLS")
	if smtpUseTLS == "" {
		smtpUseTLS = "true"
	}
	return Config{
		Env:            env,
		Port:           port,
		JWTAccessKey:   accessKey,
		JWTRefreshKey:  refreshKey,
		AccessTTLMin:   accessTTL,
		RefreshTTLHour: refreshTTL,
		DatabaseURL:    databaseURL,
		MigrationsDir:  migrationsDir,
		RedisAddr:      defaultEnv("REDIS_ADDR", "redis:6379"),
		Admin: AdminConfig{
			Email:       os.Getenv("ADMIN_EMAIL"),
			Password:    os.Getenv("ADMIN_PASSWORD"),
			DisplayName: os.Getenv("ADMIN_DISPLAY_NAME"),
		},
		Mail: MailConfig{
			Provider: mailProvider,
			From:     os.Getenv("MAIL_FROM"),
			SMTP: SMTPConfig{
				Host:     os.Getenv("SMTP_HOST"),
				Port:     smtpPort,
				Username: os.Getenv("SMTP_USERNAME"),
				Password: os.Getenv("SMTP_PASSWORD"),
				UseTLS:   smtpUseTLS,
			},
		},
		Storage: StorageConfig{
			Endpoint:       defaultEnv("STORAGE_ENDPOINT", "minio:9000"),
			PublicEndpoint: defaultEnv("STORAGE_PUBLIC_ENDPOINT", "localhost:9000"),
			AccessKey:      defaultEnv("STORAGE_ACCESS_KEY", os.Getenv("MINIO_ROOT_USER")),
			SecretKey:      defaultEnv("STORAGE_SECRET_KEY", os.Getenv("MINIO_ROOT_PASSWORD")),
			Bucket:         defaultEnv("STORAGE_BUCKET", "v0-assets"),
			UseSSL:         defaultEnv("STORAGE_USE_SSL", "false"),
		},
	}
}

func defaultEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
