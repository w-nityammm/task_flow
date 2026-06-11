package handler

import (
	"net/http"
	"taskmanager/internal/middleware"
	"taskmanager/internal/model"
	"taskmanager/internal/repository"
	"taskmanager/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type AuthHandler struct {
	userRepo *repository.UserRepository
	authSvc  *service.AuthService
	validate *validator.Validate
}

func NewAuthHandler(userRepo *repository.UserRepository, authSvc *service.AuthService) *AuthHandler {
	return &AuthHandler{
		userRepo: userRepo,
		authSvc:  authSvc,
		validate: validator.New(),
	}
}

// POST /api/v1/auth/signup
func (h *AuthHandler) Signup(c *gin.Context) {
	var req model.SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	hash, err := h.authSvc.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user := &model.User{
		ID:           uuid.New().String(),
		Email:        req.Email,
		PasswordHash: hash,
		Role:         model.RoleUser,
	}
	if err := h.userRepo.Create(user); err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already in use"})
		return
	}

	token, err := h.authSvc.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	setAuthCookie(c, token)
	c.JSON(http.StatusCreated, model.AuthResponse{User: user, Token: token})
}

// POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepo.GetByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}
	if err := h.authSvc.VerifyPassword(user.PasswordHash, req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	token, err := h.authSvc.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	setAuthCookie(c, token)
	c.JSON(http.StatusOK, model.AuthResponse{User: user, Token: token})
}

// POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	isProd := gin.Mode() == gin.ReleaseMode
	if isProd {
		c.SetSameSite(http.SameSiteNoneMode)
		c.SetCookie("auth_token", "", -1, "/", "", true, true)
	} else {
		c.SetSameSite(http.SameSiteLaxMode)
		c.SetCookie("auth_token", "", -1, "/", "", false, true)
	}
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// GET /api/v1/auth/me
func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get(middleware.ContextUserID)
	user, err := h.userRepo.GetByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func setAuthCookie(c *gin.Context, token string) {
	isProd := gin.Mode() == gin.ReleaseMode
	if isProd {
		c.SetSameSite(http.SameSiteNoneMode)
		c.SetCookie("auth_token", token, 72*3600, "/", "", true, true)
	} else {
		c.SetSameSite(http.SameSiteLaxMode)
		c.SetCookie("auth_token", token, 72*3600, "/", "", false, true)
	}
}
