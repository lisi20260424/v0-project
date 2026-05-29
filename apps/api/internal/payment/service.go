package payment

import (
	"context"
	"fmt"
	"sort"
	"sync"
	"time"
)

type OrderStatus string

const (
	OrderPending OrderStatus = "pending"
	OrderPaid    OrderStatus = "paid"
	OrderFailed  OrderStatus = "failed"
)

type Order struct {
	ID             string      `json:"id"`
	UserID         string      `json:"user_id"`
	PlanKind       string      `json:"plan_kind"`
	PlanCode       string      `json:"plan_code"`
	PlanName       string      `json:"plan_name"`
	OriginalAmount float64     `json:"original_amount"`
	BonusPoints    int         `json:"bonus_points"`
	VipTier        string      `json:"vip_tier"`
	VipStartsAt    string      `json:"vip_starts_at"`
	VipExpiresAt   string      `json:"vip_expires_at"`
	PaymentMethod  string      `json:"payment_method"`
	Amount         float64     `json:"amount"`
	Status         OrderStatus `json:"status"`
	CreatedAt      string      `json:"created_at"`
	PaidAt         string      `json:"paid_at,omitempty"`
}

type CreateOrderInput struct {
	UserID        string
	PlanKind      string
	PlanCode      string
	PaymentMethod string
}

type NotifyInput struct {
	OrderID      string
	ProviderSN   string
	ProviderStat string
}

type Service struct {
	mu     sync.RWMutex
	orders map[string]*Order
}

func NewService() *Service {
	return &Service{orders: map[string]*Order{}}
}

func (s *Service) CreateOrder(_ context.Context, in CreateOrderInput) (*Order, error) {
	if in.UserID == "" || in.PlanKind == "" || in.PlanCode == "" || in.PaymentMethod == "" {
		return nil, fmt.Errorf("missing required fields")
	}
	if in.PlanKind != "membership" && in.PlanKind != "points" {
		return nil, fmt.Errorf("invalid plan kind")
	}
	if in.PaymentMethod != "wechat" && in.PaymentMethod != "alipay" {
		return nil, fmt.Errorf("invalid payment method")
	}
	id := fmt.Sprintf("ord_%d", time.Now().UnixNano())
	amount := 19.9
	if in.PlanKind == "points" {
		amount = 9.9
	}
	order := &Order{ID: id, UserID: in.UserID, PlanKind: in.PlanKind, PlanCode: in.PlanCode, PaymentMethod: in.PaymentMethod, Amount: amount, Status: OrderPending, CreatedAt: time.Now().UTC().Format(time.RFC3339)}
	order.PlanName = in.PlanCode
	order.OriginalAmount = amount + 10
	order.BonusPoints = 100
	if in.PlanKind == "membership" {
		order.VipTier = "monthly"
		order.VipStartsAt = time.Now().UTC().Format(time.RFC3339)
		order.VipExpiresAt = time.Now().Add(30 * 24 * time.Hour).UTC().Format(time.RFC3339)
	}
	s.mu.Lock()
	s.orders[id] = order
	s.mu.Unlock()
	return order, nil
}

func (s *Service) GetOrder(_ context.Context, userID, orderID string) (*Order, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	o, ok := s.orders[orderID]
	if !ok {
		return nil, fmt.Errorf("order not found")
	}
	if o.UserID != userID {
		return nil, fmt.Errorf("forbidden")
	}
	copy := *o
	return &copy, nil
}

func (s *Service) NotifyPaid(_ context.Context, in NotifyInput) (*Order, error) {
	if in.OrderID == "" || in.ProviderSN == "" {
		return nil, fmt.Errorf("invalid notify payload")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	o, ok := s.orders[in.OrderID]
	if !ok {
		return nil, fmt.Errorf("order not found")
	}
	if o.Status == OrderPaid {
		copy := *o
		return &copy, nil
	}
	if in.ProviderStat == "SUCCESS" || in.ProviderStat == "PAID" {
		o.Status = OrderPaid
		o.PaidAt = time.Now().UTC().Format(time.RFC3339)
	} else {
		o.Status = OrderFailed
	}
	copy := *o
	return &copy, nil
}

type ListOrdersResult struct {
	Data       []Order `json:"data"`
	Total      int     `json:"total"`
	Page       int     `json:"page"`
	PageSize   int     `json:"pageSize"`
	TotalPages int     `json:"totalPages"`
	CurrentVip struct {
		Tier      string `json:"tier"`
		ExpiresAt string `json:"expiresAt"`
		Points    int    `json:"points"`
	} `json:"currentVip"`
}

func (s *Service) ListOrders(_ context.Context, userID, kind, status string, page, pageSize int) ListOrdersResult {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if page < 1 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	items := make([]Order, 0)
	for _, o := range s.orders {
		if o.UserID != userID {
			continue
		}
		if kind != "" && o.PlanKind != kind {
			continue
		}
		if status != "" && string(o.Status) != status {
			continue
		}
		items = append(items, *o)
	}
	sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt > items[j].CreatedAt })
	res := ListOrdersResult{}
	res.Total = len(items)
	res.Page = page
	res.PageSize = pageSize
	res.TotalPages = (res.Total + pageSize - 1) / pageSize
	if res.TotalPages == 0 {
		res.TotalPages = 1
	}
	start := (page - 1) * pageSize
	if start > len(items) {
		start = len(items)
	}
	end := start + pageSize
	if end > len(items) {
		end = len(items)
	}
	res.Data = items[start:end]
	for _, o := range items {
		if o.Status == OrderPaid && o.PlanKind == "membership" {
			res.CurrentVip.Tier = o.VipTier
			res.CurrentVip.ExpiresAt = o.VipExpiresAt
			break
		}
	}
	res.CurrentVip.Points = 1000
	return res
}
