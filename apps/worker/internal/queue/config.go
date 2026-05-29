package queue

import "os"

type Config struct {
	RedisAddr string
}

func LoadConfig() Config {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "redis:6379"
	}
	return Config{RedisAddr: addr}
}
