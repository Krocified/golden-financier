package handler

import (
	"database/sql"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jmoiron/sqlx"

	"golden-financier/model"
)

type TransactionHandler struct {
	DB *sqlx.DB
}

func (h *TransactionHandler) List(w http.ResponseWriter, r *http.Request) {
	f := model.ListTransactionsFilter{
		AccountID: r.URL.Query().Get("account_id"),
		Month:     r.URL.Query().Get("month"),
	}
	txns, err := model.ListTransactions(h.DB, f)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, txns)
}

func (h *TransactionHandler) Create(w http.ResponseWriter, r *http.Request) {
	var t model.Transaction
	if err := decodeJSON(r, &t); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if t.AccountID == "" {
		respondError(w, http.StatusBadRequest, "account_id is required")
		return
	}
	if t.Payee == "" {
		respondError(w, http.StatusBadRequest, "payee is required")
		return
	}
	if err := model.CreateTransaction(h.DB, &t); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, t)
}

func (h *TransactionHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	t, err := model.GetTransaction(h.DB, id)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "transaction not found")
			return
		}
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, t)
}

func (h *TransactionHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var t model.Transaction
	if err := decodeJSON(r, &t); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	t.ID = id
	if err := model.UpdateTransaction(h.DB, &t); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, t)
}

func (h *TransactionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := model.DeleteTransaction(h.DB, id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
