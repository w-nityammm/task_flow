package model

import "time"

type Status string
type Priority string

const (
	StatusTodo       Status = "todo"
	StatusInProgress Status = "in_progress"
	StatusDone       Status = "done"

	PriorityLow    Priority = "low"
	PriorityMedium Priority = "medium"
	PriorityHigh   Priority = "high"
)

type Task struct {
	ID          string    `db:"id"          json:"id"`
	UserID      string    `db:"user_id"     json:"user_id"`
	Title       string    `db:"title"       json:"title"`
	Description string    `db:"description" json:"description"`
	Status      Status    `db:"status"      json:"status"`
	Priority    Priority  `db:"priority"    json:"priority"`
	DueDate     *time.Time `db:"due_date"   json:"due_date"`
	CreatedAt   time.Time `db:"created_at"  json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"  json:"updated_at"`
}

type CreateTaskRequest struct {
	Title       string    `json:"title"       validate:"required,min=1,max=255"`
	Description string    `json:"description" validate:"max=5000"`
	Status      Status    `json:"status"      validate:"required,oneof=todo in_progress done"`
	Priority    Priority  `json:"priority"    validate:"required,oneof=low medium high"`
	DueDate     *time.Time `json:"due_date"`
}

type UpdateTaskRequest struct {
	Title       *string    `json:"title"       validate:"omitempty,min=1,max=255"`
	Description *string    `json:"description" validate:"omitempty,max=5000"`
	Status      *Status    `json:"status"      validate:"omitempty,oneof=todo in_progress done"`
	Priority    *Priority  `json:"priority"    validate:"omitempty,oneof=low medium high"`
	DueDate     *time.Time `json:"due_date"`
}

type TaskFilter struct {
	Status   string `form:"status"`
	Priority string `form:"priority"`
	Search   string `form:"search"`
	SortBy   string `form:"sort_by"`   // due_date | priority | created_at
	Order    string `form:"order"`     // asc | desc
	Page     int    `form:"page"`
	Limit    int    `form:"limit"`
	UserID   string // set by middleware
	AdminAll bool   // admin sees all tasks
}

type PaginatedTasks struct {
	Tasks      []*Task `json:"tasks"`
	Total      int     `json:"total"`
	Page       int     `json:"page"`
	Limit      int     `json:"limit"`
	TotalPages int     `json:"total_pages"`
}
