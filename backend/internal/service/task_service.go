package service

import (
	"encoding/json"
	"fmt"
	"taskmanager/internal/model"
	"taskmanager/internal/repository"

	"github.com/google/uuid"
)

// SSEEvent is broadcast to connected clients
type SSEEvent struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type TaskService struct {
	taskRepo     *repository.TaskRepository
	activityRepo *repository.ActivityRepository
	sse          *SSEHub
}

func NewTaskService(taskRepo *repository.TaskRepository, activityRepo *repository.ActivityRepository, sse *SSEHub) *TaskService {
	return &TaskService{taskRepo: taskRepo, activityRepo: activityRepo, sse: sse}
}

func (s *TaskService) Create(req *model.CreateTaskRequest, userID string) (*model.Task, error) {
	task := &model.Task{
		ID:          uuid.New().String(),
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		Priority:    req.Priority,
		DueDate:     req.DueDate,
	}
	if err := s.taskRepo.Create(task); err != nil {
		return nil, fmt.Errorf("create task: %w", err)
	}
	s.logActivity(task.ID, userID, model.ActionCreated, map[string]interface{}{"title": task.Title})
	s.sse.Broadcast(userID, SSEEvent{Type: "task.created", Payload: task})
	return task, nil
}

func (s *TaskService) List(filter model.TaskFilter) (*model.PaginatedTasks, error) {
	return s.taskRepo.List(filter)
}

func (s *TaskService) GetByID(id, userID string, isAdmin bool) (*model.Task, error) {
	return s.taskRepo.GetByID(id, userID, isAdmin)
}

func (s *TaskService) Update(id string, req *model.UpdateTaskRequest, userID string, isAdmin bool) (*model.Task, error) {
	task, err := s.taskRepo.GetByID(id, userID, isAdmin)
	if err != nil {
		return nil, err
	}

	if req.Title != nil {
		task.Title = *req.Title
	}
	if req.Description != nil {
		task.Description = *req.Description
	}
	if req.Status != nil {
		task.Status = *req.Status
	}
	if req.Priority != nil {
		task.Priority = *req.Priority
	}
	if req.DueDate != nil {
		task.DueDate = req.DueDate
	}

	if err := s.taskRepo.Update(task); err != nil {
		return nil, fmt.Errorf("update task: %w", err)
	}
	s.logActivity(task.ID, userID, model.ActionUpdated, map[string]interface{}{"title": task.Title})
	s.sse.Broadcast(userID, SSEEvent{Type: "task.updated", Payload: task})
	return task, nil
}

func (s *TaskService) Delete(id, userID string, isAdmin bool) error {
	task, err := s.taskRepo.GetByID(id, userID, isAdmin)
	if err != nil {
		return err
	}
	if err := s.taskRepo.Delete(id, userID, isAdmin); err != nil {
		return fmt.Errorf("delete task: %w", err)
	}
	s.logActivity(id, userID, model.ActionDeleted, map[string]interface{}{"title": task.Title})
	s.sse.Broadcast(userID, SSEEvent{Type: "task.deleted", Payload: map[string]string{"id": id}})
	return nil
}

func (s *TaskService) GetActivity(taskID, userID string, isAdmin bool) ([]*model.ActivityLog, error) {
	if !isAdmin {
		if _, err := s.taskRepo.GetByID(taskID, userID, false); err != nil {
			return nil, fmt.Errorf("task not found or access denied")
		}
	}
	return s.activityRepo.GetByTaskID(taskID)
}

func (s *TaskService) logActivity(taskID, userID string, action model.ActivityAction, meta map[string]interface{}) {
	b, _ := json.Marshal(meta)
	log := &model.ActivityLog{
		ID:       uuid.New().String(),
		TaskID:   taskID,
		UserID:   userID,
		Action:   action,
		Metadata: b,
	}
	_ = s.activityRepo.Insert(log)
}
