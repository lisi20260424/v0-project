package user

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct{}

func NewHandler() *Handler { return &Handler{} }

func (h *Handler) Points(c *gin.Context) {
	if c.Query("type") == "stats" {
		c.JSON(http.StatusOK, gin.H{"initialPoints": 1000, "available": 800, "used": 200})
		return
	}
	c.JSON(http.StatusOK, gin.H{"points": 800})
}

func (h *Handler) Consumption(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	if pageSize <= 0 {
		pageSize = 20
	}
	now := time.Now().UTC().Format(time.RFC3339)
	rows := []gin.H{{"id": "c1", "type": "image", "status": "success", "tool_label": "Image Model", "cost": 10, "created_at": now, "completed_at": now, "error_message": nil}}
	c.JSON(http.StatusOK, gin.H{"data": rows, "total": len(rows), "page": page, "pageSize": pageSize, "totalPages": 1})
}

func (h *Handler) DeleteAccount(c *gin.Context) {
	uid, _ := c.Get("user_id")
	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "account deleted",
		"data": gin.H{
			"userId":  uid,
			"deleted": true,
		},
	})
}
