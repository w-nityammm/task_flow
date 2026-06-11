package repository

import (
	"taskmanager/internal/model"

	"github.com/jmoiron/sqlx"
)

type ActivityRepository struct {
	db *sqlx.DB
}

func NewActivityRepository(db *sqlx.DB) *ActivityRepository {
	return &ActivityRepository{db: db}
}

func (r *ActivityRepository) Insert(log *model.ActivityLog) error {
	query := `
		INSERT INTO activity_logs (id, task_id, user_id, action, metadata)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING created_at`
	return r.db.QueryRow(query, log.ID, log.TaskID, log.UserID, log.Action, log.Metadata).
		Scan(&log.CreatedAt)
}

func (r *ActivityRepository) GetByTaskID(taskID string) ([]*model.ActivityLog, error) {
	logs := []*model.ActivityLog{}
	err := r.db.Select(&logs,
		`SELECT * FROM activity_logs WHERE task_id = $1 ORDER BY created_at DESC`,
		taskID,
	)
	return logs, err
}
