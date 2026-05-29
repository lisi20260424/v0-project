package server

import (
	"v0-project/apps/api/internal/admin"
	"v0-project/apps/api/internal/auth"
	"v0-project/apps/api/internal/billing"
	"v0-project/apps/api/internal/handler"
	"v0-project/apps/api/internal/middleware"
	"v0-project/apps/api/internal/payment"
	"v0-project/apps/api/internal/queue"
	"v0-project/apps/api/internal/tasks"
	"v0-project/apps/api/internal/user"

	"github.com/gin-gonic/gin"
)

func NewRouter() *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	r.GET("/healthz", handler.Healthz)
	r.GET("/readyz", handler.Readyz)

	producer := queue.NewAsynqProducer(queue.LoadConfig())
	taskSvc := tasks.NewService(producer)
	taskHandler := tasks.NewHandler(taskSvc)

	billSvc := billing.NewService()
	paySvc := payment.NewService()
	payHandler := payment.NewHandler(paySvc, billSvc)

	adminSvc := admin.NewService()
	adminHandler := admin.NewHandler(adminSvc)
	userHandler := user.NewHandler()

	v1 := r.Group("/v1")
	{
		v1.GET("/healthz", handler.Healthz)
		v1.POST("/auth/login", auth.Login)
		v1.POST("/auth/refresh", auth.Refresh)
		v1.POST("/auth/logout", middleware.RequireAuth(), auth.Logout)
		v1.GET("/me", middleware.RequireAuth(), auth.Me)

		v1.GET("/tasks", middleware.RequireAuth(), taskHandler.List)
		v1.POST("/tasks", middleware.RequireAuth(), taskHandler.Create)

		v1.POST("/pay/orders", middleware.RequireAuth(), payHandler.CreateOrder)
		v1.GET("/pay/orders/:id", middleware.RequireAuth(), payHandler.GetOrder)
		v1.GET("/pay/billing", middleware.RequireAuth(), payHandler.BillingRecords)
		v1.GET("/pay/subscriptions", middleware.RequireAuth(), payHandler.SubscriptionRecords)
		v1.POST("/pay/notify/shouqianba", payHandler.Notify)

		v1.GET("/user/points", middleware.RequireAuth(), userHandler.Points)
		v1.GET("/user/consumption", middleware.RequireAuth(), userHandler.Consumption)
		v1.POST("/account/delete", middleware.RequireAuth(), userHandler.DeleteAccount)

		adminGroup := v1.Group("/admin", middleware.RequireAuth(), middleware.RequireAdmin())
		{
			adminGroup.GET("/models", adminHandler.ListModels)
			adminGroup.POST("/models", adminHandler.CreateModel)
			adminGroup.PATCH("/models/:id", adminHandler.UpdateModel)
			adminGroup.DELETE("/models/:id", adminHandler.DeleteModel)
			adminGroup.GET("/providers", adminHandler.ListProviders)
			adminGroup.POST("/providers", adminHandler.CreateProvider)
			adminGroup.PATCH("/providers/:id", adminHandler.UpdateProvider)
			adminGroup.DELETE("/providers/:id", adminHandler.DeleteProvider)
			adminGroup.GET("/prompts", adminHandler.ListPrompts)
			adminGroup.POST("/prompts", adminHandler.CreatePrompt)
			adminGroup.PATCH("/prompts/:id", adminHandler.UpdatePrompt)
			adminGroup.DELETE("/prompts/:id", adminHandler.DeletePrompt)
			adminGroup.GET("/users", adminHandler.ListUsers)
			adminGroup.PATCH("/users/:id", adminHandler.UpdateUser)
			adminGroup.GET("/settings", adminHandler.GetSettings)
			adminGroup.PUT("/settings", adminHandler.UpdateSettings)
			adminGroup.PUT("/gateway", adminHandler.UpdateGateway)
			adminGroup.POST("/gateway/test", adminHandler.TestGateway)
			adminGroup.PUT("/generation-config", adminHandler.UpdateGenerationConfig)
			adminGroup.GET("/payment", adminHandler.GetPayment)
			adminGroup.PUT("/payment", adminHandler.UpdatePayment)
			adminGroup.POST("/payment/activate", adminHandler.ActivatePayment)
			adminGroup.POST("/payment/checkin", adminHandler.CheckinPayment)
		}
	}

	return r
}
