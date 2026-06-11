package handler

import (
	"net/http"
	"taskmanager/internal/middleware"
	"taskmanager/internal/model"
	"taskmanager/internal/service"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type TaskHandler struct {
	taskSvc  *service.TaskService
	sseHub   *service.SSEHub
	validate *validator.Validate
}

func NewTaskHandler(taskSvc *service.TaskService, sseHub *service.SSEHub) *TaskHandler {
	return &TaskHandler{
		taskSvc:  taskSvc,
		sseHub:   sseHub,
		validate: validator.New(),
	}
}

func getUserCtx(c *gin.Context) (userID string, isAdmin bool) {
	uid, _ := c.Get(middleware.ContextUserID)
	role, _ := c.Get(middleware.ContextRole)
	userID, _ = uid.(string)
	isAdmin = role == "admin"
	return
}

// POST /api/v1/tasks
func (h *TaskHandler) Create(c *gin.Context) {
	userID, _ := getUserCtx(c)
	var req model.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	task, err := h.taskSvc.Create(&req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, task)
}

// GET /api/v1/tasks
func (h *TaskHandler) List(c *gin.Context) {
	userID, isAdmin := getUserCtx(c)
	var filter model.TaskFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query params"})
		return
	}
	filter.UserID = userID
	filter.AdminAll = false // users only see their own tasks here

	result, err := h.taskSvc.List(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	_ = isAdmin
	c.JSON(http.StatusOK, result)
}

// GET /api/v1/tasks/:id
func (h *TaskHandler) GetByID(c *gin.Context) {
	userID, isAdmin := getUserCtx(c)
	task, err := h.taskSvc.GetByID(c.Param("id"), userID, isAdmin)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}
	c.JSON(http.StatusOK, task)
}

// PATCH /api/v1/tasks/:id
func (h *TaskHandler) Update(c *gin.Context) {
	userID, isAdmin := getUserCtx(c)
	var req model.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	task, err := h.taskSvc.Update(c.Param("id"), &req, userID, isAdmin)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, task)
}

// DELETE /api/v1/tasks/:id
func (h *TaskHandler) Delete(c *gin.Context) {
	userID, isAdmin := getUserCtx(c)
	if err := h.taskSvc.Delete(c.Param("id"), userID, isAdmin); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "task deleted"})
}

// GET /api/v1/tasks/:id/activity
func (h *TaskHandler) GetActivity(c *gin.Context) {
	userID, isAdmin := getUserCtx(c)
	logs, err := h.taskSvc.GetActivity(c.Param("id"), userID, isAdmin)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, logs)
}

// GET /api/v1/tasks/stream  — SSE
func (h *TaskHandler) Stream(c *gin.Context) {
	userID, _ := getUserCtx(c)
	ch, unsubscribe := h.sseHub.Subscribe(userID)
	defer unsubscribe()

	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no")
	c.Writer.WriteHeader(http.StatusOK)
	c.Writer.Flush()

	// Send initial ping
	c.Writer.WriteString(": ping\n\n")
	c.Writer.Flush()

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-c.Request.Context().Done():
			return
		case msg, ok := <-ch:
			if !ok {
				return
			}
			c.Writer.WriteString(msg)
			c.Writer.Flush()
		case <-ticker.C:
			// keepalive
			c.Writer.WriteString(": ping\n\n")
			c.Writer.Flush()
		}
	}
}
