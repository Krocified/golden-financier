package model

import "github.com/jmoiron/sqlx"

type MonthlyReport struct {
	CategoryID   string `db:"category_id" json:"category_id"`
	CategoryName string `db:"category_name" json:"category_name"`
	Color        string `db:"color" json:"color"`
	Icon         string `db:"icon" json:"icon"`
	TotalCents   int64  `db:"total_cents" json:"total_cents"`
	Count        int    `db:"count" json:"count"`
}

type MonthlySummary struct {
	IncomeCents  int64 `db:"income_cents" json:"income_cents"`
	ExpenseCents int64 `db:"expense_cents" json:"expense_cents"`
}

func GetMonthlyReport(db *sqlx.DB, month, userID string) ([]MonthlyReport, *MonthlySummary, error) {
	var summary MonthlySummary
	err := db.Get(&summary,
		`SELECT
			COALESCE(SUM(CASE WHEN amount_cents > 0 THEN amount_cents ELSE 0 END), 0) AS income_cents,
			COALESCE(SUM(CASE WHEN amount_cents < 0 THEN amount_cents ELSE 0 END), 0) AS expense_cents
		 FROM transactions
		 WHERE strftime('%Y-%m', date) = ? AND `+userScope(""), month, userID)
	if err != nil {
		return nil, nil, err
	}

	var reports []MonthlyReport
	err = db.Select(&reports,
		`SELECT
			c.id AS category_id,
			c.name AS category_name,
			c.color,
			c.icon,
			COALESCE(SUM(t.amount_cents), 0) AS total_cents,
			COUNT(t.id) AS count
		 FROM categories c
		 LEFT JOIN transactions t ON t.category_id = c.id AND strftime('%Y-%m', t.date) = ? AND `+userScope("t")+`
		 GROUP BY c.id
		 ORDER BY total_cents DESC`, month, userID)
	if err != nil {
		return nil, nil, err
	}

	return reports, &summary, nil
}

type NetWorthPoint struct {
	Date       string `db:"date" json:"date"`
	TotalCents int64  `db:"total_cents" json:"total_cents"`
}

func GetNetWorthHistory(db *sqlx.DB, userID string) ([]NetWorthPoint, error) {
	var points []NetWorthPoint
	err := db.Select(&points,
		`SELECT date, SUM(balance_cents) AS total_cents
		 FROM accounts
		 WHERE archived = 0 AND `+userScope("")+`
		 GROUP BY date
		 ORDER BY date`, userID)
	if err != nil {
		return nil, err
	}
	return points, nil
}
