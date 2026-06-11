package tests

import (
	"testing"
	"taskmanager/internal/model"
	"taskmanager/internal/service"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newAuthService() *service.AuthService {
	return service.NewAuthService("test-secret-key-32chars-minimum!!", 72)
}

func TestHashAndVerifyPassword(t *testing.T) {
	svc := newAuthService()

	t.Run("hashes password and verifies correctly", func(t *testing.T) {
		hash, err := svc.HashPassword("mypassword123")
		require.NoError(t, err)
		assert.NotEmpty(t, hash)
		assert.NotEqual(t, "mypassword123", hash)

		err = svc.VerifyPassword(hash, "mypassword123")
		assert.NoError(t, err)
	})

	t.Run("wrong password fails verification", func(t *testing.T) {
		hash, _ := svc.HashPassword("correctpassword")
		err := svc.VerifyPassword(hash, "wrongpassword")
		assert.Error(t, err)
	})

	t.Run("two hashes of same password are different", func(t *testing.T) {
		hash1, _ := svc.HashPassword("password")
		hash2, _ := svc.HashPassword("password")
		assert.NotEqual(t, hash1, hash2) // bcrypt uses random salt
	})
}

func TestGenerateAndParseToken(t *testing.T) {
	svc := newAuthService()

	user := &model.User{
		ID:    "user-uuid-123",
		Email: "test@example.com",
		Role:  model.RoleUser,
	}

	t.Run("generates valid token", func(t *testing.T) {
		token, err := svc.GenerateToken(user)
		require.NoError(t, err)
		assert.NotEmpty(t, token)
	})

	t.Run("parses token and returns correct claims", func(t *testing.T) {
		token, _ := svc.GenerateToken(user)
		claims, err := svc.ParseToken(token)
		require.NoError(t, err)
		assert.Equal(t, user.ID, claims.UserID)
		assert.Equal(t, user.Email, claims.Email)
		assert.Equal(t, user.Role, claims.Role)
	})

	t.Run("rejects tampered token", func(t *testing.T) {
		token, _ := svc.GenerateToken(user)
		tampered := token + "tampered"
		_, err := svc.ParseToken(tampered)
		assert.Error(t, err)
	})

	t.Run("rejects token signed with wrong secret", func(t *testing.T) {
		otherSvc := service.NewAuthService("other-secret-key-different!!!!!", 72)
		token, _ := otherSvc.GenerateToken(user)
		_, err := svc.ParseToken(token)
		assert.Error(t, err)
	})

	t.Run("admin role preserved in token", func(t *testing.T) {
		admin := &model.User{ID: "admin-1", Email: "admin@test.com", Role: model.RoleAdmin}
		token, _ := svc.GenerateToken(admin)
		claims, err := svc.ParseToken(token)
		require.NoError(t, err)
		assert.Equal(t, model.RoleAdmin, claims.Role)
	})
}
