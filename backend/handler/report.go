package handler

import (
	"net/http"

	"github.com/jmoiron/sqlx"

	"golden-financier/model"
)

type ReportHandler struct {
	DB *sqlx.DB
}

func (h *ReportHandler) Monthly(w http.ResponseWriter, r *http.Request) {
	month := r.URL.Query().Get("month")
	if month == "" {
		respondError(w, http.StatusBadRequest, "month query param required (YYYY-MM)")
		return
	}

	reports, summary, err := model.GetMonthlyReport(h.DB, month)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"summary": summary,
		"items":   reports,
	})
}

func (h *ReportHandler) NetWorth(w http.ResponseWriter, r *http.Request) {
	points, err := model.GetNetWorthHistory(h.DB)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, points)
}
