package server

import (
	"time"

	"v0-project/apps/api/internal/admin"
	"v0-project/apps/api/internal/auth"
	"v0-project/apps/api/internal/billing"
	"v0-project/apps/api/internal/handler"
	"v0-project/apps/api/internal/middleware"
	"v0-project/apps/api/internal/payment"
	"v0-project/apps/api/internal/queue"
	"v0-project/apps/api/internal/storage"
	"v0-project/apps/api/internal/tasks"
	"v0-project/apps/api/internal/user"

	"github.com/gin-gonic/gin"
)

func NewRouter() *gin.Engine {
	r := gin.New()
	r.Use(middleware.RequestID(), middleware.RequestLogger(), gin.Recovery())

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
	storageHandler := storage.NewHandler(storage.DefaultService())

	v1 := r.Group("/v1")
	{
		v1.GET("/healthz", handler.Healthz)
		v1.POST("/auth/register/request-otp", middleware.IPRateLimit("auth:register-otp", 10, time.Hour), middleware.AuditAuthSensitive("auth.register.request_otp"), auth.RequestRegisterOTP)
		v1.POST("/auth/register/verify-otp", middleware.IPRateLimit("auth:register-verify", 30, 15*time.Minute), middleware.AuditAuthSensitive("auth.register.verify_otp"), auth.VerifyRegisterOTP)
		v1.POST("/auth/login", middleware.IPRateLimit("auth:login", 20, 15*time.Minute), middleware.AuditAuthSensitive("auth.login"), auth.Login)
		v1.POST("/auth/refresh", middleware.IPRateLimit("auth:refresh", 60, 15*time.Minute), middleware.AuditAuthSensitive("auth.refresh"), auth.Refresh)
		v1.POST("/auth/password/forgot", middleware.IPRateLimit("auth:password-forgot", 10, time.Hour), middleware.AuditAuthSensitive("auth.password.forgot"), auth.ForgotPassword)
		v1.POST("/auth/password/reset", middleware.IPRateLimit("auth:password-reset", 30, 15*time.Minute), middleware.AuditAuthSensitive("auth.password.reset"), auth.ResetPassword)
		v1.POST("/auth/logout", middleware.RequireAuth(), middleware.AuditAuthSensitive("auth.logout"), auth.Logout)
		v1.POST("/auth/password/change", middleware.RequireAuth(), middleware.AuditAuthSensitive("auth.password.change"), auth.ChangePassword)
		v1.GET("/me", middleware.RequireAuth(), auth.Me)
		v1.GET("/models", adminHandler.PublicModels)
		v1.GET("/providers", adminHandler.PublicProviders)
		v1.GET("/prompts", adminHandler.PublicPrompts)

		v1.GET("/tasks", middleware.RequireAuth(), taskHandler.List)
		v1.POST("/tasks", middleware.RequireAuth(), middleware.RequireActive(), taskHandler.Create)
		v1.GET("/tasks/:id", middleware.RequireAuth(), taskHandler.Get)
		v1.DELETE("/tasks/:id", middleware.RequireAuth(), taskHandler.Delete)

		v1.POST("/pay/orders", middleware.RequireAuth(), middleware.RequireActive(), payHandler.CreateOrder)
		v1.GET("/pay/orders/:id", middleware.RequireAuth(), payHandler.GetOrder)
		v1.GET("/pay/billing", middleware.RequireAuth(), payHandler.BillingRecords)
		v1.GET("/pay/subscriptions", middleware.RequireAuth(), payHandler.SubscriptionRecords)
		v1.POST("/pay/notify/shouqianba", payHandler.Notify)

		v1.GET("/user/points", middleware.RequireAuth(), userHandler.Points)
		v1.GET("/user/consumption", middleware.RequireAuth(), userHandler.Consumption)
		v1.GET("/user/profile", middleware.RequireAuth(), userHandler.GetProfile)
		v1.PATCH("/user/profile", middleware.RequireAuth(), userHandler.UpdateProfile)
		v1.GET("/user/preferences", middleware.RequireAuth(), userHandler.GetPreferences)
		v1.PUT("/user/preferences", middleware.RequireAuth(), userHandler.UpdatePreferences)
		v1.GET("/user/security", middleware.RequireAuth(), userHandler.GetSecurity)
		v1.POST("/account/delete", middleware.RequireAuth(), userHandler.DeleteAccount)
		v1.POST("/assets/presign-upload", middleware.RequireAuth(), storageHandler.PresignUpload)
		v1.POST("/assets/complete-upload", middleware.RequireAuth(), storageHandler.CompleteUpload)
		v1.GET("/assets/:id", middleware.RequireAuth(), storageHandler.GetAsset)

		adminGroup := v1.Group("/admin", middleware.RequireAuth(), middleware.RequireAdmin(), middleware.AuditAdminWrite())
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
			adminGroup.GET("/gateway", adminHandler.GetGateway)
			adminGroup.PUT("/gateway", adminHandler.UpdateGateway)
			adminGroup.POST("/gateway/test", adminHandler.TestGateway)
			adminGroup.GET("/generation-config", adminHandler.GetGenerationConfig)
			adminGroup.PUT("/generation-config", adminHandler.UpdateGenerationConfig)
			adminGroup.GET("/payment", adminHandler.GetPayment)
			adminGroup.PUT("/payment", adminHandler.UpdatePayment)
			adminGroup.POST("/payment/activate", adminHandler.ActivatePayment)
			adminGroup.POST("/payment/checkin", adminHandler.CheckinPayment)
		}
	}

	return r
}
