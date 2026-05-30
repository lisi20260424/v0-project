package billing

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Record struct {
	ID                 string  `json:"id"`
	UserID             string  `json:"user_id"`
	Type               string  `json:"type"`
	Direction          string  `json:"direction"`
	Amount             float64 `json:"amount"`
	Points             int     `json:"points"`
	PointsBalanceAfter int     `json:"points_balance_after"`
	Description        string  `json:"description"`
	PaymentMethod      string  `json:"payment_method"`
	RelatedOrderID     string  `json:"related_order_id"`
	RelatedTaskID      string  `json:"related_task_id"`
	CreatedAt          string  `json:"created_at"`
}

type Service struct {
	mu      sync.RWMutex
	records []Record
	pool    *pgxpool.Pool
}

var billingPool *pgxpool.Pool

func InitDB(pool *pgxpool.Pool) {
	billingPool = pool
}

func NewService() *Service {
	return &Service{records: []Record{}, pool: billingPool}
}

func (s *Service) AddPaidOrder(_ context.Context, userID, orderID string) {
	if s.pool != nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.records = append(s.records, Record{
		ID:                 "bill_" + orderID,
		UserID:             userID,
		Type:               "recharge",
		Direction:          "in",
		Amount:             19.9,
		Points:             100,
		PointsBalanceAfter: 1000,
		Description:        "order paid: " + orderID,
		PaymentMethod:      "wechat",
		RelatedOrderID:     orderID,
		RelatedTaskID:      "",
		CreatedAt:          time.Now().UTC().Format(time.RFC3339),
	})
}

type ListResult struct {
	Data       []Record `json:"data"`
	Total      int      `json:"total"`
	Page       int      `json:"page"`
	PageSize   int      `json:"pageSize"`
	TotalPages int      `json:"totalPages"`
	Summary    struct {
		TotalRecharge    float64 `json:"totalRecharge"`
		TotalSpentPoints int     `json:"totalSpentPoints"`
		TotalRefund      float64 `json:"totalRefund"`
	} `json:"summary"`
}

func (s *Service) ListByUser(ctx context.Context, userID, recordType, direction string, page, pageSize int) (ListResult, error) {
	if s.pool != nil {
		return s.dbListByUser(ctx, userID, recordType, direction, page, pageSize)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	if page < 1 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	filtered := make([]Record, 0)
	for _, r := range s.records {
		if r.UserID != userID {
			continue
		}
		if recordType != "" && r.Type != recordType {
			continue
		}
		if direction != "" && r.Direction != direction {
			continue
		}
		filtered = append(filtered, r)
	}

	res := ListResult{}
	res.Total = len(filtered)
	res.Page = page
	res.PageSize = pageSize
	res.TotalPages = (res.Total + pageSize - 1) / pageSize
	if res.TotalPages == 0 {
		res.TotalPages = 1
	}
	start := (page - 1) * pageSize
	if start > len(filtered) {
		start = len(filtered)
	}
	end := start + pageSize
	if end > len(filtered) {
		end = len(filtered)
	}
	res.Data = filtered[start:end]

	for _, r := range filtered {
		switch r.Type {
		case "recharge":
			res.Summary.TotalRecharge += r.Amount
		case "consumption":
			res.Summary.TotalSpentPoints += r.Points
		case "refund":
			res.Summary.TotalRefund += r.Amount
		}
	}
	return res, nil
}

func (s *Service) dbListByUser(ctx context.Context, userID, recordType, direction string, page, pageSize int) (ListResult, error) {
	if page < 1 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	rows, err := s.pool.Query(ctx, `
SELECT id, user_id::text, type, direction, amount::float8, points, points_balance_after, description, payment_method, COALESCE(related_order_id,''), COALESCE(related_task_id,''), created_at
FROM billing_records
WHERE user_id=$1 AND ($2='' OR type=$2) AND ($3='' OR direction=$3)
ORDER BY created_at DESC
`, userID, recordType, direction)
	if err != nil {
		return ListResult{}, err
	}
	defer rows.Close()
	filtered := make([]Record, 0)
	for rows.Next() {
		var r Record
		var createdAt time.Time
		if err := rows.Scan(&r.ID, &r.UserID, &r.Type, &r.Direction, &r.Amount, &r.Points, &r.PointsBalanceAfter, &r.Description, &r.PaymentMethod, &r.RelatedOrderID, &r.RelatedTaskID, &createdAt); err != nil {
			return ListResult{}, err
		}
		r.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		filtered = append(filtered, r)
	}
	res := ListResult{Total: len(filtered), Page: page, PageSize: pageSize}
	res.TotalPages = (res.Total + pageSize - 1) / pageSize
	if res.TotalPages == 0 {
		res.TotalPages = 1
	}
	start := (page - 1) * pageSize
	if start > len(filtered) {
		start = len(filtered)
	}
	end := start + pageSize
	if end > len(filtered) {
		end = len(filtered)
	}
	res.Data = filtered[start:end]
	for _, r := range filtered {
		switch r.Type {
		case "recharge":
			res.Summary.TotalRecharge += r.Amount
		case "consumption":
			res.Summary.TotalSpentPoints += r.Points
		case "refund":
			res.Summary.TotalRefund += r.Amount
		}
	}
	return res, rows.Err()
}

func ParsePage(v string, def int) int {
	if v == "" {
		return def
	}
	var n int
	_, _ = fmt.Sscanf(v, "%d", &n)
	if n <= 0 {
		return def
	}
	return n
}
