package middleware

import (
	"context"
	"log"
	"net"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type ipWindow struct {
	hits []time.Time
}

type ipLimiter struct {
	mu          sync.Mutex
	windows     map[string]*ipWindow
	lastCleanup time.Time
}

var defaultIPLimiter = &ipLimiter{windows: map[string]*ipWindow{}}
var ipLimiterCleanupWindow = time.Hour
var redisRateLimiter *redis.Client

func InitRateLimiter(redisAddr string) {
	if redisAddr == "" {
		log.Printf("rate limiter using in-memory backend")
		return
	}
	client := redis.NewClient(&redis.Options{Addr: redisAddr})
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("rate limiter redis unavailable addr=%s err=%v; using in-memory backend", redisAddr, err)
		_ = client.Close()
		return
	}
	redisRateLimiter = client
	log.Printf("rate limiter using redis backend addr=%s", redisAddr)
}

func IPRateLimit(scope string, maxHits int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if maxHits <= 0 || window <= 0 {
			c.Next()
			return
		}
		key := scope + ":" + clientIP(c)
		allowed, retryAfter := allowIP(c.Request.Context(), key, maxHits, window, time.Now())
		if !allowed {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"code":    20010,
				"message": "too many requests",
				"data":    gin.H{"retryAfter": int(retryAfter.Seconds()) + 1},
			})
			return
		}
		c.Next()
	}
}

func allowIP(ctx context.Context, key string, maxHits int, window time.Duration, now time.Time) (bool, time.Duration) {
	if redisRateLimiter == nil {
		return defaultIPLimiter.allow(key, maxHits, window, now)
	}
	allowed, retryAfter, err := redisAllow(ctx, key, maxHits, window, now)
	if err != nil {
		log.Printf("rate limiter redis error key=%s err=%v; using in-memory fallback", key, err)
		return defaultIPLimiter.allow(key, maxHits, window, now)
	}
	return allowed, retryAfter
}

func redisAllow(ctx context.Context, key string, maxHits int, window time.Duration, now time.Time) (bool, time.Duration, error) {
	redisKey := "rate_limit:ip:" + key
	cutoff := now.Add(-window).UnixMilli()
	member := now.UnixNano()
	pipe := redisRateLimiter.TxPipeline()
	pipe.ZRemRangeByScore(ctx, redisKey, "0", strconv.FormatInt(cutoff, 10))
	pipe.ZAdd(ctx, redisKey, redis.Z{Score: float64(now.UnixMilli()), Member: member})
	countCmd := pipe.ZCard(ctx, redisKey)
	pipe.Expire(ctx, redisKey, window+time.Minute)
	if _, err := pipe.Exec(ctx); err != nil {
		return false, 0, err
	}
	count := countCmd.Val()
	if count <= int64(maxHits) {
		return true, 0, nil
	}

	// Remove the over-limit hit so rejected requests do not extend the window.
	if err := redisRateLimiter.ZRem(ctx, redisKey, member).Err(); err != nil {
		return false, 0, err
	}
	oldest, err := redisRateLimiter.ZRangeWithScores(ctx, redisKey, 0, 0).Result()
	if err != nil {
		return false, 0, err
	}
	if len(oldest) == 0 {
		return false, window, nil
	}
	retryAt := time.UnixMilli(int64(oldest[0].Score)).Add(window)
	return false, retryAt.Sub(now), nil
}

func (l *ipLimiter) allow(key string, maxHits int, window time.Duration, now time.Time) (bool, time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()

	if now.Sub(l.lastCleanup) > time.Minute {
		l.cleanup(now, ipLimiterCleanupWindow)
		l.lastCleanup = now
	}

	cutoff := now.Add(-window)
	w := l.windows[key]
	if w == nil {
		w = &ipWindow{}
		l.windows[key] = w
	}

	kept := w.hits[:0]
	for _, hit := range w.hits {
		if hit.After(cutoff) {
			kept = append(kept, hit)
		}
	}
	w.hits = kept
	if len(w.hits) >= maxHits {
		return false, w.hits[0].Add(window).Sub(now)
	}
	w.hits = append(w.hits, now)
	return true, 0
}

func (l *ipLimiter) cleanup(now time.Time, window time.Duration) {
	cutoff := now.Add(-window)
	for key, w := range l.windows {
		if len(w.hits) == 0 || w.hits[len(w.hits)-1].Before(cutoff) {
			delete(l.windows, key)
		}
	}
}

func clientIP(c *gin.Context) string {
	ip := c.ClientIP()
	if parsed := net.ParseIP(ip); parsed != nil {
		return parsed.String()
	}
	host, _, err := net.SplitHostPort(c.Request.RemoteAddr)
	if err == nil {
		return host
	}
	return c.Request.RemoteAddr
}
