package queue

import "os"

type Config struct {
	RedisAddr        string
	DatabaseURL      string
	StorageEndpoint  string
	StorageAccessKey string
	StorageSecretKey string
	StorageBucket    string
	StorageUseSSL    string
}

func LoadConfig() Config {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "redis:6379"
	}
	return Config{
		RedisAddr:        addr,
		DatabaseURL:      os.Getenv("DATABASE_URL"),
		StorageEndpoint:  defaultEnv("STORAGE_ENDPOINT", "minio:9000"),
		StorageAccessKey: defaultEnv("STORAGE_ACCESS_KEY", os.Getenv("MINIO_ROOT_USER")),
		StorageSecretKey: defaultEnv("STORAGE_SECRET_KEY", os.Getenv("MINIO_ROOT_PASSWORD")),
		StorageBucket:    defaultEnv("STORAGE_BUCKET", "v0-assets"),
		StorageUseSSL:    defaultEnv("STORAGE_USE_SSL", "false"),
	}
}

func defaultEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
