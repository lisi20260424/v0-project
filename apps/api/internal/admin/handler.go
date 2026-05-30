package admin

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

type createModelReq struct {
	Name        string         `json:"name"`
	Provider    string         `json:"provider"`
	ModelType   string         `json:"modelType"`
	Enabled     bool           `json:"enabled"`
	Description string         `json:"description"`
	CostPerUse  int            `json:"costPerUse"`
	SortOrder   int            `json:"sortOrder"`
	Config      map[string]any `json:"config"`
}
type createProviderReq struct {
	Name        string         `json:"name"`
	DisplayName string         `json:"displayName"`
	Enabled     bool           `json:"enabled"`
	Description string         `json:"description"`
	SortOrder   int            `json:"sortOrder"`
	Config      map[string]any `json:"config"`
}
type createPromptReq struct {
	ModelType string `json:"modelType"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	Category  string `json:"category"`
	Enabled   bool   `json:"enabled"`
	SortOrder int    `json:"sortOrder"`
}
type updateSettingsReq struct {
	GatewayURL string `json:"gatewayUrl"`
}
type updateGatewayReq struct {
	APIKey     string `json:"apiKey"`
	GatewayURL string `json:"gatewayUrl"`
}
type updateGenReq struct {
	MusicTimeout int `json:"musicTimeout"`
	ImageTimeout int `json:"imageTimeout"`
	VideoTimeout int `json:"videoTimeout"`
}

func (h *Handler) ListModels(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"models": h.svc.ListModels(c.Request.Context())})
}

func (h *Handler) PublicModels(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"models": h.svc.ListEnabledModels(c.Request.Context(), c.Query("type"))})
}

func (h *Handler) PublicProviders(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"providers": h.svc.ListEnabledProviders(c.Request.Context())})
}

func (h *Handler) PublicPrompts(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"prompts": h.svc.ListEnabledPrompts(c.Request.Context(), c.Query("type"))})
}
func (h *Handler) CreateModel(c *gin.Context) {
	var req createModelReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid params"})
		return
	}
	m, err := h.svc.CreateModel(c.Request.Context(), Model{Name: req.Name, Provider: req.Provider, ModelType: req.ModelType, Enabled: req.Enabled, Description: req.Description, CostPerUse: req.CostPerUse, SortOrder: req.SortOrder, Config: req.Config})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"model": m})
}
func (h *Handler) UpdateModel(c *gin.Context) {
	var body map[string]any
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid params"})
		return
	}
	m, err := h.svc.UpdateModel(c.Request.Context(), c.Param("id"), body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"model": m})
}
func (h *Handler) DeleteModel(c *gin.Context) {
	if err := h.svc.DeleteModel(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) ListProviders(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"providers": h.svc.ListProviders(c.Request.Context())})
}
func (h *Handler) CreateProvider(c *gin.Context) {
	var req createProviderReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid params"})
		return
	}
	p, err := h.svc.CreateProvider(c.Request.Context(), Provider{Name: req.Name, DisplayName: req.DisplayName, Enabled: req.Enabled, Description: req.Description, SortOrder: req.SortOrder, Config: req.Config})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"provider": p})
}
func (h *Handler) UpdateProvider(c *gin.Context) {
	var body map[string]any
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid params"})
		return
	}
	p, err := h.svc.UpdateProvider(c.Request.Context(), c.Param("id"), body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"provider": p})
}
func (h *Handler) DeleteProvider(c *gin.Context) {
	if err := h.svc.DeleteProvider(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) ListPrompts(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"prompts": h.svc.ListPrompts(c.Request.Context())})
}
func (h *Handler) CreatePrompt(c *gin.Context) {
	var req createPromptReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid params"})
		return
	}
	p, err := h.svc.CreatePrompt(c.Request.Context(), Prompt{ModelType: req.ModelType, Title: req.Title, Content: req.Content, Category: req.Category, Enabled: req.Enabled, SortOrder: req.SortOrder})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"prompt": p})
}
func (h *Handler) UpdatePrompt(c *gin.Context) {
	var body map[string]any
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid params"})
		return
	}
	p, err := h.svc.UpdatePrompt(c.Request.Context(), c.Param("id"), body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"prompt": p})
}
func (h *Handler) DeletePrompt(c *gin.Context) {
	if err := h.svc.DeletePrompt(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) ListUsers(c *gin.Context) {
	users := h.svc.ListUsers(c.Request.Context())
	c.JSON(http.StatusOK, gin.H{"users": users, "total": len(users), "page": 1, "pageSize": 20})
}
func (h *Handler) UpdateUser(c *gin.Context) {
	var body map[string]any
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid params"})
		return
	}
	u, err := h.svc.UpdateUser(c.Request.Context(), c.Param("id"), body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": u})
}

func (h *Handler) GetSettings(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": h.svc.GetSettings(c.Request.Context())})
}
func (h *Handler) UpdateSettings(c *gin.Context) {
	var req updateSettingsReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid params"})
		return
	}
	out := h.svc.UpdateSettings(c.Request.Context(), SystemSettings{GatewayURL: req.GatewayURL})
	c.JSON(http.StatusOK, gin.H{"data": out})
}

var gatewayState = struct {
	APIKey     string `json:"apiKey"`
	GatewayURL string `json:"gatewayUrl"`
}{}

var generationState = struct {
	MusicTimeout int    `json:"musicTimeout"`
	ImageTimeout int    `json:"imageTimeout"`
	VideoTimeout int    `json:"videoTimeout"`
	UpdatedAt    string `json:"updatedAt"`
}{MusicTimeout: 600, ImageTimeout: 300, VideoTimeout: 1800}

var paymentState = map[string]any{
	"enabled": false, "vendor_sn": "", "vendor_key": "", "app_id": "", "terminal_sn": "", "terminal_key": "",
	"device_id": "", "operator": "", "notify_url": "", "return_url": "", "gateway_url": "", "callback_public_key": "", "test_mode": true, "updated_at": "",
}

func (h *Handler) GetGateway(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": h.svc.GetGateway(c.Request.Context())})
}

func (h *Handler) UpdateGateway(c *gin.Context) {
	var req updateGatewayReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid params"})
		return
	}
	out := h.svc.UpdateGateway(c.Request.Context(), GatewaySettings{APIKey: req.APIKey, GatewayURL: req.GatewayURL})
	c.JSON(http.StatusOK, gin.H{"ok": true, "data": out})
}

func (h *Handler) TestGateway(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"ok": true, "latency": 42, "message": "ok"})
}

func (h *Handler) GetGenerationConfig(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": h.svc.GetGenerationConfig(c.Request.Context())})
}

func (h *Handler) UpdateGenerationConfig(c *gin.Context) {
	var req updateGenReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid params"})
		return
	}
	out := h.svc.UpdateGenerationConfig(c.Request.Context(), GenerationConfig{MusicTimeout: req.MusicTimeout, ImageTimeout: req.ImageTimeout, VideoTimeout: req.VideoTimeout})
	c.JSON(http.StatusOK, gin.H{"ok": true, "data": out})
}

func (h *Handler) GetPayment(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": h.svc.GetPayment(c.Request.Context())})
}

func (h *Handler) UpdatePayment(c *gin.Context) {
	var body map[string]any
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid params"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": h.svc.UpdatePayment(c.Request.Context(), body)})
}

func (h *Handler) ActivatePayment(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"ok": true, "data": h.svc.ActivatePayment(c.Request.Context())})
}

func (h *Handler) CheckinPayment(c *gin.Context) {
	h.svc.CheckinPayment(c.Request.Context())
	c.JSON(http.StatusOK, gin.H{"ok": true, "message": "checkin ok"})
}
