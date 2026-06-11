package repository

import (
	"fmt"
	"math"
	"strings"
	"taskmanager/internal/model"

	"github.com/jmoiron/sqlx"
)

type TaskRepository struct {
	db *sqlx.DB
}

func NewTaskRepository(db *sqlx.DB) *TaskRepository {
	return &TaskRepository{db: db}
}

func (r *TaskRepository) Create(task *model.Task) error {
	query := `
		INSERT INTO tasks (id, user_id, title, description, status, priority, due_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at, updated_at`
	return r.db.QueryRow(query,
		task.ID, task.UserID, task.Title, task.Description,
		task.Status, task.Priority, task.DueDate,
	).Scan(&task.CreatedAt, &task.UpdatedAt)
}

func (r *TaskRepository) List(f model.TaskFilter) (*model.PaginatedTasks, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 || f.Limit > 100 {
		f.Limit = 20
	}

	conditions := []string{}
	args := []interface{}{}
	argIdx := 1

	if !f.AdminAll {
		conditions = append(conditions, fmt.Sprintf("user_id = $%d", argIdx))
		args = append(args, f.UserID)
		argIdx++
	}
	if f.Status != "" {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, f.Status)
		argIdx++
	}
	if f.Priority != "" {
		conditions = append(conditions, fmt.Sprintf("priority = $%d", argIdx))
		args = append(args, f.Priority)
		argIdx++
	}
	if f.Search != "" {
		conditions = append(conditions, fmt.Sprintf("title ILIKE $%d", argIdx))
		args = append(args, "%"+f.Search+"%")
		argIdx++
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tasks %s", where)
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, err
	}

	// Sorting
	allowedSort := map[string]string{
		"due_date":   "due_date",
		"priority":   "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END",
		"created_at": "created_at",
	}
	sortCol, ok := allowedSort[f.SortBy]
	if !ok {
		sortCol = "created_at"
	}
	order := "DESC"
	if strings.ToUpper(f.Order) == "ASC" {
		order = "ASC"
	}

	offset := (f.Page - 1) * f.Limit
	listQuery := fmt.Sprintf(`
		SELECT * FROM tasks %s
		ORDER BY %s %s NULLS LAST
		LIMIT $%d OFFSET $%d`,
		where, sortCol, order, argIdx, argIdx+1,
	)
	args = append(args, f.Limit, offset)

	tasks := []*model.Task{}
	if err := r.db.Select(&tasks, listQuery, args...); err != nil {
		return nil, err
	}

	return &model.PaginatedTasks{
		Tasks:      tasks,
		Total:      total,
		Page:       f.Page,
		Limit:      f.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(f.Limit))),
	}, nil
}

func (r *TaskRepository) GetByID(id, userID string, isAdmin bool) (*model.Task, error) {
	task := &model.Task{}
	var err error
	if isAdmin {
		err = r.db.Get(task, `SELECT * FROM tasks WHERE id = $1`, id)
	} else {
		err = r.db.Get(task, `SELECT * FROM tasks WHERE id = $1 AND user_id = $2`, id, userID)
	}
	if err != nil {
		return nil, fmt.Errorf("task not found: %w", err)
	}
	return task, nil
}

func (r *TaskRepository) Update(task *model.Task) error {
	query := `
		UPDATE tasks SET
			title       = $1,
			description = $2,
			status      = $3,
			priority    = $4,
			due_date    = $5
		WHERE id = $6 AND user_id = $7
		RETURNING updated_at`
	err := r.db.QueryRow(query,
		task.Title, task.Description, task.Status, task.Priority,
		task.DueDate, task.ID, task.UserID,
	).Scan(&task.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to update task: %w", err)
	}
	return nil
}

func (r *TaskRepository) Delete(id, userID string, isAdmin bool) error {
	var err error
	if isAdmin {
		_, err = r.db.Exec(`DELETE FROM tasks WHERE id = $1`, id)
	} else {
		_, err = r.db.Exec(`DELETE FROM tasks WHERE id = $1 AND user_id = $2`, id, userID)
	}
	return err
}
