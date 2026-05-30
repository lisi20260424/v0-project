package storage

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	svc *Service
}

type presignUploadRequest struct {
	Kind      string `json:"kind"`
	FileName  string `json:"fileName"`
	MIMEType  string `json:"mimeType"`
	SizeBytes int64  `json:"sizeBytes"`
}

type completeUploadRequest struct {
	AssetID   string `json:"assetId"`
	SizeBytes int64  `json:"sizeBytes"`
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) PresignUpload(c *gin.Context) {
	var req presignUploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "invalid params"})
		return
	}
	result, err := h.svc.PresignUpload(c.Request.Context(), PresignUploadInput{UserID: c.GetString("user_id"), Kind: req.Kind, FileName: req.FileName, MIMEType: req.MIMEType, SizeBytes: req.SizeBytes})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40001, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": result})
}

func (h *Handler) CompleteUpload(c *gin.Context) {
	var req completeUploadRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.AssetID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 10001, "message": "invalid params"})
		return
	}
	asset, err := h.svc.CompleteUpload(c.Request.Context(), CompleteUploadInput{UserID: c.GetString("user_id"), AssetID: req.AssetID, Size: req.SizeBytes})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 40001, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": asset})
}

func (h *Handler) GetAsset(c *gin.Context) {
	asset, err := h.svc.GetAsset(c.Request.Context(), c.GetString("user_id"), c.Param("id"))
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "asset not found" {
			status = http.StatusNotFound
		}
		if err.Error() == "forbidden" {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"code": 40001, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": asset})
}
