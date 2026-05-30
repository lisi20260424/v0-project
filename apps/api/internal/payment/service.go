package payment

import (
	"context"
	"crypto/md5"
	"database/sql"
	"encoding/hex"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
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

func (s *Service) VerifyNotifySignature(ctx context.Context, rawBody []byte, authorization string) error {
	if s.pool == nil {
		return nil
	}
	key, err := s.paymentTerminalKey(ctx)
	if err != nil {
		return err
	}
	if key == "" {
		return nil
	}
	parts := strings.Fields(strings.TrimSpace(authorization))
	if len(parts) == 0 {
		return fmt.Errorf("missing payment notify signature")
	}
	remote := strings.ToLower(parts[len(parts)-1])
	sum := md5.Sum(append(rawBody, []byte(key)...))
	local := hex.EncodeToString(sum[:])
	if remote != local {
		return fmt.Errorf("invalid payment notify signature")
	}
	return nil
}

func (s *Service) paymentTerminalKey(ctx context.Context) (string, error) {
	var key string
	err := s.pool.QueryRow(ctx, `SELECT COALESCE(value->>'terminal_key','') FROM admin_settings WHERE key='payment'`).Scan(&key)
	if err == pgx.ErrNoRows {
		return "", nil
	}
	return key, err
}

type Service struct {
	mu     sync.RWMutex
	orders map[string]*Order
	pool   *pgxpool.Pool
}

var paymentPool *pgxpool.Pool

func InitDB(pool *pgxpool.Pool) {
	paymentPool = pool
}

func NewService() *Service {
	return &Service{orders: map[string]*Order{}, pool: paymentPool}
}

func (s *Service) CreateOrder(ctx context.Context, in CreateOrderInput) (*Order, error) {
	if in.UserID == "" || in.PlanKind == "" || in.PlanCode == "" || in.PaymentMethod == "" {
		return nil, fmt.Errorf("missing required fields")
	}
	if in.PlanKind != "membership" && in.PlanKind != "points" {
		return nil, fmt.Errorf("invalid plan kind")
	}
	if in.PaymentMethod != "wechat" && in.PaymentMethod != "alipay" {
		return nil, fmt.Errorf("invalid payment method")
	}
	if s.pool != nil {
		return s.dbCreateOrder(ctx, in)
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

func (s *Service) GetOrder(ctx context.Context, userID, orderID string) (*Order, error) {
	if s.pool != nil {
		return s.dbGetOrder(ctx, userID, orderID)
	}
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

func (s *Service) NotifyPaid(ctx context.Context, in NotifyInput) (*Order, error) {
	if in.OrderID == "" || in.ProviderSN == "" {
		return nil, fmt.Errorf("invalid notify payload")
	}
	if s.pool != nil {
		return s.dbNotifyPaid(ctx, in)
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

func (s *Service) ListOrders(ctx context.Context, userID, kind, status string, page, pageSize int) ListOrdersResult {
	if s.pool != nil {
		res, err := s.dbListOrders(ctx, userID, kind, status, page, pageSize)
		if err == nil {
			return res
		}
	}
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

func buildOrder(in CreateOrderInput) *Order {
	id := fmt.Sprintf("ord_%d", time.Now().UnixNano())
	amount := 19.9
	bonusPoints := 100
	if in.PlanKind == "points" {
		amount = 9.9
		bonusPoints = 1000
	}
	now := time.Now().UTC()
	order := &Order{ID: id, UserID: in.UserID, PlanKind: in.PlanKind, PlanCode: in.PlanCode, PlanName: in.PlanCode, PaymentMethod: in.PaymentMethod, Amount: amount, OriginalAmount: amount + 10, BonusPoints: bonusPoints, Status: OrderPending, CreatedAt: now.Format(time.RFC3339)}
	if in.PlanKind == "membership" {
		order.VipTier = "monthly"
		order.VipStartsAt = now.Format(time.RFC3339)
		order.VipExpiresAt = now.Add(30 * 24 * time.Hour).Format(time.RFC3339)
	}
	return order
}

func (s *Service) dbCreateOrder(ctx context.Context, in CreateOrderInput) (*Order, error) {
	order := buildOrder(in)
	return s.scanOrderRow(ctx, `
INSERT INTO subscription_orders (id, user_id, plan_kind, plan_code, plan_name, original_amount, amount, bonus_points, vip_tier, vip_starts_at, vip_expires_at, payment_method, status)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending')
RETURNING id, user_id::text, plan_kind, plan_code, plan_name, original_amount::float8, bonus_points, COALESCE(vip_tier,''), vip_starts_at, vip_expires_at, payment_method, amount::float8, status, created_at, paid_at
`, order.ID, order.UserID, order.PlanKind, order.PlanCode, order.PlanName, order.OriginalAmount, order.Amount, order.BonusPoints, nullableString(order.VipTier), nullableTime(order.VipStartsAt), nullableTime(order.VipExpiresAt), order.PaymentMethod)
}

func (s *Service) dbGetOrder(ctx context.Context, userID, orderID string) (*Order, error) {
	order, err := s.scanOrderRow(ctx, `
SELECT id, user_id::text, plan_kind, plan_code, plan_name, original_amount::float8, bonus_points, COALESCE(vip_tier,''), vip_starts_at, vip_expires_at, payment_method, amount::float8, status, created_at, paid_at
FROM subscription_orders WHERE id=$1
`, orderID)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("order not found")
	}
	if err != nil {
		return nil, err
	}
	if order.UserID != userID {
		return nil, fmt.Errorf("forbidden")
	}
	return order, nil
}

func (s *Service) dbNotifyPaid(ctx context.Context, in NotifyInput) (*Order, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	order, err := scanOrder(tx.QueryRow(ctx, `
SELECT id, user_id::text, plan_kind, plan_code, plan_name, original_amount::float8, bonus_points, COALESCE(vip_tier,''), vip_starts_at, vip_expires_at, payment_method, amount::float8, status, created_at, paid_at
FROM subscription_orders WHERE id=$1 FOR UPDATE
`, in.OrderID))
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("order not found")
	}
	if err != nil {
		return nil, err
	}
	if order.Status == OrderPaid {
		return order, tx.Commit(ctx)
	}
	if in.ProviderStat != "SUCCESS" && in.ProviderStat != "PAID" {
		_, err = tx.Exec(ctx, `UPDATE subscription_orders SET status='failed', provider_sn=$2, updated_at=now() WHERE id=$1`, in.OrderID, in.ProviderSN)
		if err != nil {
			return nil, err
		}
		order.Status = OrderFailed
		return order, tx.Commit(ctx)
	}

	var balanceAfter int64
	err = tx.QueryRow(ctx, `
UPDATE user_profiles
SET points = points + $2,
    vip_tier = COALESCE($3, vip_tier),
    vip_expires_at = COALESCE($4, vip_expires_at),
    updated_at = now()
WHERE user_id=$1
RETURNING points
`, order.UserID, order.BonusPoints, nullableString(order.VipTier), nullableTime(order.VipExpiresAt)).Scan(&balanceAfter)
	if err != nil {
		return nil, err
	}
	paidAt := time.Now().UTC()
	_, err = tx.Exec(ctx, `UPDATE subscription_orders SET status='paid', provider_sn=$2, paid_at=$3, updated_at=now() WHERE id=$1`, in.OrderID, in.ProviderSN, paidAt)
	if err != nil {
		return nil, err
	}
	_, err = tx.Exec(ctx, `
INSERT INTO billing_records (id, user_id, type, direction, amount, points, points_balance_after, description, payment_method, related_order_id)
VALUES ($1,$2,'recharge','in',$3,$4,$5,$6,$7,$8)
ON CONFLICT (id) DO NOTHING
`, "bill_"+order.ID, order.UserID, order.Amount, order.BonusPoints, balanceAfter, "order paid: "+order.ID, order.PaymentMethod, order.ID)
	if err != nil {
		return nil, err
	}
	_, err = tx.Exec(ctx, `
INSERT INTO user_point_ledger (id, user_id, direction, points, balance_after, reason, related_order_id)
VALUES ($1,$2,'in',$3,$4,'order_paid',$5)
ON CONFLICT (id) DO NOTHING
`, "ledger_"+order.ID, order.UserID, order.BonusPoints, balanceAfter, order.ID)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	order.Status = OrderPaid
	order.PaidAt = paidAt.Format(time.RFC3339)
	return order, nil
}

func (s *Service) dbListOrders(ctx context.Context, userID, kind, status string, page, pageSize int) (ListOrdersResult, error) {
	if page < 1 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	rows, err := s.pool.Query(ctx, `
SELECT id, user_id::text, plan_kind, plan_code, plan_name, original_amount::float8, bonus_points, COALESCE(vip_tier,''), vip_starts_at, vip_expires_at, payment_method, amount::float8, status, created_at, paid_at
FROM subscription_orders
WHERE user_id=$1 AND ($2='' OR plan_kind=$2) AND ($3='' OR status=$3)
ORDER BY created_at DESC
`, userID, kind, status)
	if err != nil {
		return ListOrdersResult{}, err
	}
	defer rows.Close()
	items := make([]Order, 0)
	for rows.Next() {
		order, err := scanOrder(rows)
		if err != nil {
			return ListOrdersResult{}, err
		}
		items = append(items, *order)
	}
	res := paginateOrders(items, page, pageSize)
	var vipExpiresAt sql.NullTime
	if err := s.pool.QueryRow(ctx, `SELECT COALESCE(points,0), COALESCE(vip_tier,''), vip_expires_at FROM user_profiles WHERE user_id=$1`, userID).Scan(&res.CurrentVip.Points, &res.CurrentVip.Tier, &vipExpiresAt); err == nil && vipExpiresAt.Valid {
		res.CurrentVip.ExpiresAt = vipExpiresAt.Time.UTC().Format(time.RFC3339)
	}
	return res, rows.Err()
}

func paginateOrders(items []Order, page, pageSize int) ListOrdersResult {
	res := ListOrdersResult{Total: len(items), Page: page, PageSize: pageSize}
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
	return res
}

func (s *Service) scanOrderRow(ctx context.Context, sql string, args ...any) (*Order, error) {
	return scanOrder(s.pool.QueryRow(ctx, sql, args...))
}

type orderScanner interface{ Scan(dest ...any) error }

func scanOrder(row orderScanner) (*Order, error) {
	var order Order
	var vipStartsAt, vipExpiresAt, paidAt sql.NullTime
	var createdAt time.Time
	if err := row.Scan(&order.ID, &order.UserID, &order.PlanKind, &order.PlanCode, &order.PlanName, &order.OriginalAmount, &order.BonusPoints, &order.VipTier, &vipStartsAt, &vipExpiresAt, &order.PaymentMethod, &order.Amount, &order.Status, &createdAt, &paidAt); err != nil {
		return nil, err
	}
	order.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	if vipStartsAt.Valid {
		order.VipStartsAt = vipStartsAt.Time.UTC().Format(time.RFC3339)
	}
	if vipExpiresAt.Valid {
		order.VipExpiresAt = vipExpiresAt.Time.UTC().Format(time.RFC3339)
	}
	if paidAt.Valid {
		order.PaidAt = paidAt.Time.UTC().Format(time.RFC3339)
	}
	return &order, nil
}

func nullableString(v string) any {
	if v == "" {
		return nil
	}
	return v
}

func nullableTime(v string) any {
	if v == "" {
		return nil
	}
	t, err := time.Parse(time.RFC3339, v)
	if err != nil {
		return nil
	}
	return t
}
