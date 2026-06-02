package handler

import (
	"database/sql"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jmoiron/sqlx"

	"golden-financier/model"
)

type AccountHandler struct {
	DB *sqlx.DB
}

func (h *AccountHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := UserFromContext(r.Context()).UserID
	accounts, err := model.ListAccounts(h.DB, userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, accounts)
}

func (h *AccountHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := UserFromContext(r.Context()).UserID
	var a model.Account
	if err := decodeJSON(r, &a); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if a.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}
	if a.Type == "" {
		respondError(w, http.StatusBadRequest, "type is required")
		return
	}
	if err := model.CreateAccount(h.DB, &a, userID); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, a)
}

func (h *AccountHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := UserFromContext(r.Context()).UserID
	id := chi.URLParam(r, "id")
	a, err := model.GetAccount(h.DB, id, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "account not found")
			return
		}
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, a)
}

func (h *AccountHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := UserFromContext(r.Context()).UserID
	id := chi.URLParam(r, "id")
	var a model.Account
	if err := decodeJSON(r, &a); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	a.ID = id
	if err := model.UpdateAccount(h.DB, &a, userID); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, a)
}

func (h *AccountHandler) Archive(w http.ResponseWriter, r *http.Request) {
	userID := UserFromContext(r.Context()).UserID
	id := chi.URLParam(r, "id")
	if err := model.ArchiveAccount(h.DB, id, userID); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
