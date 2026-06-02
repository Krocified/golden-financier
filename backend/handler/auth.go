package handler

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jmoiron/sqlx"
	"github.com/oklog/ulid/v2"
	"golang.org/x/crypto/bcrypt"
)

type userContextKey struct{}

type UserClaims struct {
	UserID string `json:"sub"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

type AuthHandler struct {
	DB        *sqlx.DB
	JWTSecret string
}

func jwtSecret() string {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		b := make([]byte, 32)
		if _, err := rand.Read(b); err != nil {
			log.Fatalf("failed to generate JWT_SECRET: %v", err)
		}
		s = hex.EncodeToString(b)
		log.Printf("JWT_SECRET not set; generated ephemeral key: %s", s)
		log.Println("WARNING: this key will change on restart — set JWT_SECRET in production")
	}
	return s
}

func signAccessToken(secret string, userID, email string) (string, error) {
	claims := UserClaims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func generateRefreshToken() (string, string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", "", err
	}
	raw := hex.EncodeToString(b)
	hash := sha256.Sum256([]byte(raw))
	return raw, hex.EncodeToString(hash[:]), nil
}

func (h *AuthHandler) issueTokens(userID, email string) (map[string]interface{}, error) {
	accessToken, err := signAccessToken(h.JWTSecret, userID, email)
	if err != nil {
		return nil, err
	}

	raw, hash, err := generateRefreshToken()
	if err != nil {
		return nil, err
	}

	id := ulid.Make().String()
	expiresAt := time.Now().Add(30 * 24 * time.Hour).UTC().Format(time.RFC3339)
	_, err = h.DB.Exec(
		`INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`,
		id, userID, hash, expiresAt,
	)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"access_token":  accessToken,
		"refresh_token": raw,
	}, nil
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		secret := jwtSecret()

		parts := strings.SplitN(r.Header.Get("Authorization"), " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		token, err := jwt.ParseWithClaims(parts[1], &UserClaims{}, func(t *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		claims := token.Claims.(*UserClaims)
		ctx := context.WithValue(r.Context(), userContextKey{}, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func UserFromContext(ctx context.Context) *UserClaims {
	claims, _ := ctx.Value(userContextKey{}).(*UserClaims)
	return claims
}

// --- Auth endpoints ---

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
	}
	if err := decodeJSON(r, &body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	body.Email = strings.TrimSpace(strings.ToLower(body.Email))
	if body.Email == "" || !strings.Contains(body.Email, "@") {
		respondError(w, http.StatusBadRequest, "valid email is required")
		return
	}
	if len(body.Password) < 8 {
		respondError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	id := ulid.Make().String()
	_, err = h.DB.Exec("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
		id, body.Email, string(hash), body.Name)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			respondError(w, http.StatusConflict, "email already registered")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	tokens, err := h.issueTokens(id, body.Email)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to issue tokens")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"access_token":  tokens["access_token"],
		"refresh_token": tokens["refresh_token"],
		"user": map[string]string{
			"id":    id,
			"email": body.Email,
			"name":  body.Name,
		},
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := decodeJSON(r, &body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	body.Email = strings.TrimSpace(strings.ToLower(body.Email))
	if body.Email == "" {
		respondError(w, http.StatusBadRequest, "email is required")
		return
	}

	var user struct {
		ID           string `db:"id"`
		Email        string `db:"email"`
		PasswordHash string `db:"password_hash"`
		Name         string `db:"name"`
	}
	err := h.DB.Get(&user, "SELECT id, email, password_hash, name FROM users WHERE email = ?", body.Email)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(body.Password)); err != nil {
		respondError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	tokens, err := h.issueTokens(user.ID, user.Email)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to issue tokens")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"access_token":  tokens["access_token"],
		"refresh_token": tokens["refresh_token"],
		"user": map[string]string{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.Name,
		},
	})
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := decodeJSON(r, &body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.RefreshToken == "" {
		respondError(w, http.StatusBadRequest, "refresh_token is required")
		return
	}

	hash := sha256.Sum256([]byte(body.RefreshToken))
	tokenHash := hex.EncodeToString(hash[:])

	var row struct {
		ID        string `db:"id"`
		UserID    string `db:"user_id"`
		ExpiresAt string `db:"expires_at"`
	}
	err := h.DB.Get(&row, "SELECT id, user_id, expires_at FROM refresh_tokens WHERE token_hash = ?", tokenHash)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid refresh token")
		return
	}

	expiresAt, err := time.Parse(time.RFC3339, row.ExpiresAt)
	if err != nil || time.Now().After(expiresAt) {
		h.DB.Exec("DELETE FROM refresh_tokens WHERE id = ?", row.ID)
		respondError(w, http.StatusUnauthorized, "refresh token expired")
		return
	}

	// delete old token (rotation)
	h.DB.Exec("DELETE FROM refresh_tokens WHERE id = ?", row.ID)

	var user struct {
		Email string `db:"email"`
		Name  string `db:"name"`
	}
	err = h.DB.Get(&user, "SELECT email, name FROM users WHERE id = ?", row.UserID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "user not found")
		return
	}

	tokens, err := h.issueTokens(row.UserID, user.Email)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to issue tokens")
		return
	}

	respondJSON(w, http.StatusOK, tokens)
}

func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	if err := decodeJSON(r, &body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	body.Email = strings.TrimSpace(strings.ToLower(body.Email))
	if body.Email == "" {
		respondError(w, http.StatusBadRequest, "email is required")
		return
	}

	var userID string
	err := h.DB.Get(&userID, "SELECT id FROM users WHERE email = ?", body.Email)
	if err != nil {
		// Don't reveal whether the email exists
		respondJSON(w, http.StatusOK, map[string]string{"message": "if the email exists, a reset link has been generated"})
		return
	}

	raw, hash, err := generateRefreshToken()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	id := ulid.Make().String()
	expiresAt := time.Now().Add(1 * time.Hour).UTC().Format(time.RFC3339)
	_, err = h.DB.Exec(
		`INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`,
		id, userID, hash, expiresAt,
	)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create reset token")
		return
	}

	log.Printf("Password reset token for %s: %s", body.Email, raw)

	respondJSON(w, http.StatusOK, map[string]string{
		"message":       "if the email exists, a reset link has been generated",
		"reset_token":   raw,
	})
}

func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ResetToken string `json:"reset_token"`
		Password   string `json:"password"`
	}
	if err := decodeJSON(r, &body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.ResetToken == "" {
		respondError(w, http.StatusBadRequest, "reset_token is required")
		return
	}
	if len(body.Password) < 8 {
		respondError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}

	hash := sha256.Sum256([]byte(body.ResetToken))
	tokenHash := hex.EncodeToString(hash[:])

	var row struct {
		ID        string `db:"id"`
		UserID    string `db:"user_id"`
		Used      bool   `db:"used"`
		ExpiresAt string `db:"expires_at"`
	}
	err := h.DB.Get(&row, "SELECT id, user_id, used, expires_at FROM password_reset_tokens WHERE token_hash = ?", tokenHash)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid reset token")
		return
	}

	if row.Used {
		respondError(w, http.StatusUnauthorized, "reset token already used")
		return
	}

	expiresAt, err := time.Parse(time.RFC3339, row.ExpiresAt)
	if err != nil || time.Now().After(expiresAt) {
		respondError(w, http.StatusUnauthorized, "reset token expired")
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	tx, err := h.DB.Beginx()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to start transaction")
		return
	}
	defer tx.Rollback()

	_, err = tx.Exec("UPDATE users SET password_hash = ? WHERE id = ?", string(newHash), row.UserID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update password")
		return
	}

	_, err = tx.Exec("UPDATE password_reset_tokens SET used = 1 WHERE id = ?", row.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to mark token as used")
		return
	}

	// Revoke all refresh tokens for the user
	_, err = tx.Exec("DELETE FROM refresh_tokens WHERE user_id = ?", row.UserID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to revoke tokens")
		return
	}

	if err := tx.Commit(); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to commit")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "password updated"})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := UserFromContext(r.Context())
	if claims == nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var name string
	h.DB.Get(&name, "SELECT name FROM users WHERE id = ?", claims.UserID)

	respondJSON(w, http.StatusOK, map[string]string{
		"id":    claims.UserID,
		"email": claims.Email,
		"name":  name,
	})
}

func NewAuthHandler(db *sqlx.DB) *AuthHandler {
	return &AuthHandler{DB: db, JWTSecret: jwtSecret()}
}
