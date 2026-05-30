package tasks

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	svc *Service
}

type createTaskRequest struct {
	Type    string `json:"type"`
	ModelID string `json:"modelId"`
	Prompt  string `json:"prompt"`
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Create(c *gin.Context) {
	var req createTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "invalid params"})
		return
	}
	uid := c.GetString("user_id")
	task, err := h.svc.Create(c.Request.Context(), CreateTaskInput{
		UserID:  uid,
		Type:    req.Type,
		ModelID: req.ModelID,
		Prompt:  req.Prompt,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40001, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": task})
}

func (h *Handler) List(c *gin.Context) {
	uid := c.GetString("user_id")
	items, err := h.svc.List(c.Request.Context(), uid)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40001, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": gin.H{"tasks": items}})
}

func (h *Handler) Get(c *gin.Context) {
	uid := c.GetString("user_id")
	task, err := h.svc.Get(c.Request.Context(), uid, c.Param("id"))
	if err != nil {
		writeTaskError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": task})
}

func (h *Handler) Delete(c *gin.Context) {
	uid := c.GetString("user_id")
	if err := h.svc.Delete(c.Request.Context(), uid, c.Param("id")); err != nil {
		writeTaskError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "task deleted"})
}

func writeTaskError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		c.JSON(http.StatusNotFound, gin.H{"code": 40004, "message": err.Error()})
	case errors.Is(err, ErrForbidden):
		c.JSON(http.StatusForbidden, gin.H{"code": 30001, "message": err.Error()})
	default:
		c.JSON(http.StatusBadRequest, gin.H{"code": 40001, "message": err.Error()})
	}
}
