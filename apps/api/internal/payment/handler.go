package payment

import (
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
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "invalid params"})
		return
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
