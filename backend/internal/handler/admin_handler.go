package handler

import (
	"net/http"
	"taskmanager/internal/model"
	"taskmanager/internal/service"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	taskSvc *service.TaskService
}

func NewAdminHandler(taskSvc *service.TaskService) *AdminHandler {
	return &AdminHandler{taskSvc: taskSvc}
}

// GET /api/v1/admin/tasks
func (h *AdminHandler) ListAllTasks(c *gin.Context) {
	var filter model.TaskFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query params"})
		return
	}
	filter.AdminAll = true

	result, err := h.taskSvc.List(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}
