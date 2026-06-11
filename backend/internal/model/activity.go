package model

import (
	"encoding/json"
	"time"
)

type ActivityAction string

const (
	ActionCreated ActivityAction = "created"
	ActionUpdated ActivityAction = "updated"
	ActionDeleted ActivityAction = "deleted"
)

type ActivityLog struct {
	ID        string          `db:"id"         json:"id"`
	TaskID    string          `db:"task_id"    json:"task_id"`
	UserID    string          `db:"user_id"    json:"user_id"`
	Action    ActivityAction  `db:"action"     json:"action"`
	Metadata  json.RawMessage `db:"metadata"   json:"metadata"`
	CreatedAt time.Time       `db:"created_at" json:"created_at"`
}
