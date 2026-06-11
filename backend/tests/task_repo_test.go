package tests

import (
	"fmt"
	"os"
	"testing"
	"taskmanager/internal/database"
	"taskmanager/internal/model"
	"taskmanager/internal/repository"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTaskRepo(t *testing.T) (*repository.TaskRepository, *repository.UserRepository, string, func()) {
	t.Helper()
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	db, err := database.Connect(dbURL)
	require.NoError(t, err)

	userRepo := repository.NewUserRepository(db)
	taskRepo := repository.NewTaskRepository(db)

	// Create a test user
	user := &model.User{
		ID:           uuid.New().String(),
		Email:        fmt.Sprintf("repo-test-%s@test.com", uuid.New().String()[:8]),
		PasswordHash: "hash",
		Role:         model.RoleUser,
	}
	require.NoError(t, userRepo.Create(user))

	cleanup := func() {
		db.Exec("DELETE FROM tasks WHERE user_id = $1", user.ID)
		db.Exec("DELETE FROM users WHERE id = $1", user.ID)
		db.Close()
	}

	return taskRepo, userRepo, user.ID, cleanup
}

func TestTaskRepoFilterSortPagination(t *testing.T) {
	taskRepo, _, userID, cleanup := setupTaskRepo(t)
	defer cleanup()

	// Seed tasks
	statuses := []model.Status{model.StatusTodo, model.StatusTodo, model.StatusInProgress, model.StatusDone}
	priorities := []model.Priority{model.PriorityHigh, model.PriorityMedium, model.PriorityLow, model.PriorityHigh}
	for i, s := range statuses {
		task := &model.Task{
			ID:       uuid.New().String(),
			UserID:   userID,
			Title:    fmt.Sprintf("Task %d", i+1),
			Status:   s,
			Priority: priorities[i],
		}
		require.NoError(t, taskRepo.Create(task))
	}

	t.Run("filter by status=todo returns 2 tasks", func(t *testing.T) {
		result, err := taskRepo.List(model.TaskFilter{UserID: userID, Status: "todo", Page: 1, Limit: 20})
		require.NoError(t, err)
		assert.Equal(t, 2, result.Total)
		for _, task := range result.Tasks {
			assert.Equal(t, model.StatusTodo, task.Status)
		}
	})

	t.Run("pagination returns correct page size", func(t *testing.T) {
		result, err := taskRepo.List(model.TaskFilter{UserID: userID, Page: 1, Limit: 2})
		require.NoError(t, err)
		assert.Len(t, result.Tasks, 2)
		assert.Equal(t, 4, result.Total)
		assert.Equal(t, 2, result.TotalPages)
	})

	t.Run("search by title", func(t *testing.T) {
		result, err := taskRepo.List(model.TaskFilter{UserID: userID, Search: "Task 1", Page: 1, Limit: 20})
		require.NoError(t, err)
		assert.Equal(t, 1, result.Total)
		assert.Equal(t, "Task 1", result.Tasks[0].Title)
	})

	t.Run("sort by priority asc puts high first", func(t *testing.T) {
		result, err := taskRepo.List(model.TaskFilter{UserID: userID, SortBy: "priority", Order: "asc", Page: 1, Limit: 20})
		require.NoError(t, err)
		require.GreaterOrEqual(t, len(result.Tasks), 2)
		// High priority should come first when sorted asc (CASE 1=high)
		assert.Equal(t, model.PriorityHigh, result.Tasks[0].Priority)
	})

	t.Run("admin can see all tasks (AdminAll=true)", func(t *testing.T) {
		result, err := taskRepo.List(model.TaskFilter{AdminAll: true, Page: 1, Limit: 100})
		require.NoError(t, err)
		assert.GreaterOrEqual(t, result.Total, 4)
	})
}
