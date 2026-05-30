package payment

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"v0-project/apps/api/internal/billing"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	paySvc  *Service
	billSvc *billing.Service
}

type createOrderRequest struct {
	PlanKind      string `json:"planKind"`
	PlanCode      string `json:"planCode"`
	PaymentMethod string `json:"paymentMethod"`
}

type notifyRequest struct {
	OrderID      string `json:"orderId"`
	ProviderSN   string `json:"providerSn"`
	ProviderStat string `json:"providerStatus"`
}

func NewHandler(paySvc *Service, billSvc *billing.Service) *Handler {
	return &Handler{paySvc: paySvc, billSvc: billSvc}
}

func (h *Handler) CreateOrder(c *gin.Context) {
	var req createOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "invalid params"})
		return
	}
	uid := c.GetString("user_id")
	order, err := h.paySvc.CreateOrder(c.Request.Context(), CreateOrderInput{UserID: uid, PlanKind: req.PlanKind, PlanCode: req.PlanCode, PaymentMethod: req.PaymentMethod})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40001, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": order})
}

func (h *Handler) GetOrder(c *gin.Context) {
	uid := c.GetString("user_id")
	orderID := c.Param("id")
	order, err := h.paySvc.GetOrder(c.Request.Context(), uid, orderID)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "order not found" {
			status = http.StatusNotFound
		}
		if err.Error() == "forbidden" {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"code": 40004, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": order})
}

func (h *Handler) Notify(c *gin.Context) {
	var req notifyRequest
	raw, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "invalid params"})
		return
	}
	if err := h.paySvc.VerifyNotifySignature(c.Request.Context(), raw, c.GetHeader("Authorization")); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 30002, "message": err.Error()})
		return
	}
	if err := json.Unmarshal(raw, &req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "invalid params"})
		return
	}
	if req.OrderID == "" || req.ProviderStat == "" || req.ProviderSN == "" {
		req = parseFlexibleNotify(raw, req)
	}
	order, err := h.paySvc.NotifyPaid(c.Request.Context(), NotifyInput{OrderID: req.OrderID, ProviderSN: req.ProviderSN, ProviderStat: req.ProviderStat})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40001, "message": err.Error()})
		return
	}
	if order.Status == OrderPaid {
		h.billSvc.AddPaidOrder(c.Request.Context(), order.UserID, order.ID)
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "SUCCESS"})
}

func parseFlexibleNotify(raw []byte, fallback notifyRequest) notifyRequest {
	var body map[string]any
	if err := json.Unmarshal(raw, &body); err != nil {
		return fallback
	}
	data := body
	if biz, ok := body["biz_response"].(map[string]any); ok {
		if nested, ok := biz["data"].(map[string]any); ok {
			data = nested
		} else {
			data = biz
		}
	}
	if fallback.OrderID == "" {
		fallback.OrderID = firstString(data, "orderId", "order_id", "client_sn", "clientSn")
	}
	if fallback.ProviderSN == "" {
		fallback.ProviderSN = firstString(data, "providerSn", "provider_sn", "sn", "trade_no")
	}
	if fallback.ProviderStat == "" {
		fallback.ProviderStat = firstString(data, "providerStatus", "provider_status", "order_status", "status")
	}
	return fallback
}

func firstString(values map[string]any, keys ...string) string {
	for _, key := range keys {
		if value, ok := values[key].(string); ok && value != "" {
			return value
		}
	}
	return ""
}

func (h *Handler) BillingRecords(c *gin.Context) {
	uid := c.GetString("user_id")
	recordType := strings.TrimSpace(c.Query("type"))
	direction := strings.TrimSpace(c.Query("direction"))
	page := billing.ParsePage(c.Query("page"), 1)
	pageSize := billing.ParsePage(c.Query("pageSize"), 20)
	result, err := h.billSvc.ListByUser(c.Request.Context(), uid, recordType, direction, page, pageSize)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40001, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *Handler) SubscriptionRecords(c *gin.Context) {
	uid := c.GetString("user_id")
	kind := strings.TrimSpace(c.Query("kind"))
	status := strings.TrimSpace(c.Query("status"))
	page := billing.ParsePage(c.Query("page"), 1)
	pageSize := billing.ParsePage(c.Query("pageSize"), 20)
	result := h.paySvc.ListOrders(c.Request.Context(), uid, kind, status, page, pageSize)
	c.JSON(http.StatusOK, result)
}
