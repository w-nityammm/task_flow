package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"taskmanager/internal/config"
	"taskmanager/internal/database"
	"taskmanager/internal/handler"
	"taskmanager/internal/middleware"
	"taskmanager/internal/model"
	"taskmanager/internal/repository"
	"taskmanager/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestServer(t *testing.T) (*gin.Engine, *service.AuthService, func()) {
	t.Helper()
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	db, err := database.Connect(dbURL)
	require.NoError(t, err)

	_, filename, _, _ := runtime.Caller(0)
	migrationsDir := filepath.Join(filepath.Dir(filename), "..", "migrations")
	err = database.RunMigrations(db, migrationsDir)
	require.NoError(t, err)

	cfg := config.Load()
	authSvc := service.NewAuthService(cfg.JWTSecret, cfg.JWTExpiryHours)
	sseHub := service.NewSSEHub()

	userRepo := repository.NewUserRepository(db)
	taskRepo := repository.NewTaskRepository(db)
	activityRepo := repository.NewActivityRepository(db)
	taskSvc := service.NewTaskService(taskRepo, activityRepo, sseHub)

	authH := handler.NewAuthHandler(userRepo, authSvc)
	taskH := handler.NewTaskHandler(taskSvc, sseHub)

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/v1/auth/signup", authH.Signup)
	r.POST("/api/v1/auth/login", authH.Login)

	protected := r.Group("/api/v1/tasks", middleware.Auth(authSvc))
	protected.POST("", taskH.Create)
	protected.GET("", taskH.List)
	protected.GET("/:id", taskH.GetByID)
	protected.PATCH("/:id", taskH.Update)
	protected.DELETE("/:id", taskH.Delete)

	cleanup := func() {
		db.Exec("DELETE FROM activity_logs")
		db.Exec("DELETE FROM tasks")
		db.Exec("DELETE FROM users WHERE email LIKE '%@test.com'")
		db.Close()
	}
	return r, authSvc, cleanup
}

func registerAndLogin(t *testing.T, r *gin.Engine, email string) string {
	t.Helper()
	body, _ := json.Marshal(map[string]string{"email": email, "password": "testpass123"})

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest("POST", "/api/v1/auth/signup", bytes.NewReader(body)))
	if w.Code == http.StatusConflict {
		w = httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(body)))
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	return resp["token"].(string)
}

func TestTaskCRUD(t *testing.T) {
	r, _, cleanup := setupTestServer(t)
	defer cleanup()

	token := registerAndLogin(t, r, fmt.Sprintf("handler-test-%d@test.com", 1))
	auth := func(req *http.Request) *http.Request {
		req.Header.Set("Authorization", "Bearer "+token)
		return req
	}

	var taskID string

	t.Run("Create task", func(t *testing.T) {
		body, _ := json.Marshal(model.CreateTaskRequest{
			Title:    "Test Task",
			Status:   model.StatusTodo,
			Priority: model.PriorityMedium,
		})
		w := httptest.NewRecorder()
		r.ServeHTTP(w, auth(httptest.NewRequest("POST", "/api/v1/tasks", bytes.NewReader(body))))
		assert.Equal(t, http.StatusCreated, w.Code)

		var task model.Task
		json.Unmarshal(w.Body.Bytes(), &task)
		assert.NotEmpty(t, task.ID)
		assert.Equal(t, "Test Task", task.Title)
		taskID = task.ID
	})

	t.Run("List tasks", func(t *testing.T) {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, auth(httptest.NewRequest("GET", "/api/v1/tasks", nil)))
		assert.Equal(t, http.StatusOK, w.Code)

		var result model.PaginatedTasks
		json.Unmarshal(w.Body.Bytes(), &result)
		assert.GreaterOrEqual(t, result.Total, 1)
	})

	t.Run("Get task by ID", func(t *testing.T) {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, auth(httptest.NewRequest("GET", "/api/v1/tasks/"+taskID, nil)))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("Update task status to done", func(t *testing.T) {
		done := model.StatusDone
		body, _ := json.Marshal(model.UpdateTaskRequest{Status: &done})
		w := httptest.NewRecorder()
		r.ServeHTTP(w, auth(httptest.NewRequest("PATCH", "/api/v1/tasks/"+taskID, bytes.NewReader(body))))
		assert.Equal(t, http.StatusOK, w.Code)

		var task model.Task
		json.Unmarshal(w.Body.Bytes(), &task)
		assert.Equal(t, model.StatusDone, task.Status)
	})

	t.Run("Delete task", func(t *testing.T) {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, auth(httptest.NewRequest("DELETE", "/api/v1/tasks/"+taskID, nil)))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("Cannot access deleted task", func(t *testing.T) {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, auth(httptest.NewRequest("GET", "/api/v1/tasks/"+taskID, nil)))
		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("Unauthenticated request rejected", func(t *testing.T) {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest("GET", "/api/v1/tasks", nil))
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}
