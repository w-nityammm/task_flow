package repository

import (
	"fmt"
	"taskmanager/internal/model"

	"github.com/jmoiron/sqlx"
)

type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *model.User) error {
	query := `
		INSERT INTO users (id, email, password_hash, role)
		VALUES ($1, $2, $3, $4)
		RETURNING created_at`
	return r.db.QueryRow(query, user.ID, user.Email, user.PasswordHash, user.Role).
		Scan(&user.CreatedAt)
}

func (r *UserRepository) GetByEmail(email string) (*model.User, error) {
	user := &model.User{}
	err := r.db.Get(user, `SELECT * FROM users WHERE email = $1`, email)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return user, nil
}

func (r *UserRepository) GetByID(id string) (*model.User, error) {
	user := &model.User{}
	err := r.db.Get(user, `SELECT * FROM users WHERE id = $1`, id)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return user, nil
}
