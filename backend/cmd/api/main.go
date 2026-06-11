package main

import (
	"log"
	"path/filepath"
	"runtime"
	"strings"
	"taskmanager/internal/config"
	"taskmanager/internal/database"
	"taskmanager/internal/handler"
	"taskmanager/internal/middleware"
	"taskmanager/internal/repository"
	"taskmanager/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Close()

	// Run SQL migrations
	_, filename, _, _ := runtime.Caller(0)
	projectRoot := filepath.Join(filepath.Dir(filename), "..", "..")
	migrationsDir := filepath.Join(projectRoot, "migrations")
	if err := database.RunMigrations(db, migrationsDir); err != nil {
		log.Fatalf("Migrations failed: %v", err)
	}

	// Wire up repositories, services, handlers
	userRepo := repository.NewUserRepository(db)
	taskRepo := repository.NewTaskRepository(db)
	activityRepo := repository.NewActivityRepository(db)

	authSvc := service.NewAuthService(cfg.JWTSecret, cfg.JWTExpiryHours)
	sseHub := service.NewSSEHub()
	taskSvc := service.NewTaskService(taskRepo, activityRepo, sseHub)

	authHandler := handler.NewAuthHandler(userRepo, authSvc)
	taskHandler := handler.NewTaskHandler(taskSvc, sseHub)
	adminHandler := handler.NewAdminHandler(taskSvc)

	// Router setup
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

	// CORS
	origins := strings.Split(cfg.AllowedOrigins, ",")
	r.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	api := r.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/signup", authHandler.Signup)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
			auth.GET("/me", middleware.Auth(authSvc), authHandler.Me)
		}

		tasks := api.Group("/tasks", middleware.Auth(authSvc))
		{
			tasks.POST("", taskHandler.Create)
			tasks.GET("", taskHandler.List)
			tasks.GET("/stream", taskHandler.Stream)
			tasks.GET("/:id", taskHandler.GetByID)
			tasks.PATCH("/:id", taskHandler.Update)
			tasks.DELETE("/:id", taskHandler.Delete)
			tasks.GET("/:id/activity", taskHandler.GetActivity)
		}

		admin := api.Group("/admin", middleware.Auth(authSvc), middleware.AdminOnly())
		{
			admin.GET("/tasks", adminHandler.ListAllTasks)
		}
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	log.Printf("Server starting on :%s (env=%s)", cfg.Port, cfg.Env)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
