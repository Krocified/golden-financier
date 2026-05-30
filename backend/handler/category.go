package handler

import (
	"database/sql"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jmoiron/sqlx"

	"golden-financier/model"
)

type CategoryHandler struct {
	DB *sqlx.DB
}

func (h *CategoryHandler) List(w http.ResponseWriter, r *http.Request) {
	cats, err := model.ListCategories(h.DB)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, cats)
}

func (h *CategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var c model.Category
	if err := decodeJSON(r, &c); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if c.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}
	if c.Color == "" {
		c.Color = "#6366f1"
	}
	if err := model.CreateCategory(h.DB, &c); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, c)
}

func (h *CategoryHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	c, err := model.GetCategory(h.DB, id)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "category not found")
			return
		}
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, c)
}

func (h *CategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var c model.Category
	if err := decodeJSON(r, &c); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	c.ID = id
	if err := model.UpdateCategory(h.DB, &c); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, c)
}

func (h *CategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := model.DeleteCategory(h.DB, id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
