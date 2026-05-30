package model

import (
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/oklog/ulid/v2"
)

type Transaction struct {
	ID          string  `db:"id" json:"id"`
	AccountID   string  `db:"account_id" json:"account_id"`
	Date        string  `db:"date" json:"date"`
	AmountCents int64   `db:"amount_cents" json:"amount_cents"`
	Payee       string  `db:"payee" json:"payee"`
	CategoryID  *string `db:"category_id" json:"category_id,omitempty"`
	Notes       string  `db:"notes" json:"notes"`
	Reconciled  bool    `db:"reconciled" json:"reconciled"`
	CreatedAt   string  `db:"created_at" json:"created_at"`
}

type ListTransactionsFilter struct {
	AccountID string
	Month     string
}

func CreateTransaction(db *sqlx.DB, t *Transaction) error {
	t.ID = ulid.Make().String()
	t.CreatedAt = time.Now().UTC().Format(time.RFC3339)

	tx, err := db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(
		`INSERT INTO transactions (id, account_id, date, amount_cents, payee, category_id, notes, reconciled, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		t.ID, t.AccountID, t.Date, t.AmountCents, t.Payee,
		t.CategoryID, t.Notes, t.Reconciled, t.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert transaction: %w", err)
	}

	_, err = tx.Exec("UPDATE accounts SET balance_cents = balance_cents + ? WHERE id = ?", t.AmountCents, t.AccountID)
	if err != nil {
		return fmt.Errorf("update balance: %w", err)
	}

	return tx.Commit()
}

func GetTransaction(db *sqlx.DB, id string) (*Transaction, error) {
	var t Transaction
	err := db.Get(&t, "SELECT * FROM transactions WHERE id = ?", id)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func ListTransactions(db *sqlx.DB, f ListTransactionsFilter) ([]Transaction, error) {
	var conditions []string
	var args []interface{}

	if f.AccountID != "" {
		conditions = append(conditions, "account_id = ?")
		args = append(args, f.AccountID)
	}
	if f.Month != "" {
		conditions = append(conditions, "strftime('%Y-%m', date) = ?")
		args = append(args, f.Month)
	}

	query := "SELECT * FROM transactions"
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY date DESC, created_at DESC"

	var txns []Transaction
	err := db.Select(&txns, query, args...)
	if err != nil {
		return nil, err
	}
	return txns, nil
}

func UpdateTransaction(db *sqlx.DB, t *Transaction) error {
	old, err := GetTransaction(db, t.ID)
	if err != nil {
		return fmt.Errorf("get old transaction: %w", err)
	}

	tx, err := db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(
		`UPDATE transactions SET account_id = ?, date = ?, amount_cents = ?, payee = ?,
		 category_id = ?, notes = ?, reconciled = ? WHERE id = ?`,
		t.AccountID, t.Date, t.AmountCents, t.Payee,
		t.CategoryID, t.Notes, t.Reconciled, t.ID,
	)
	if err != nil {
		return fmt.Errorf("update transaction: %w", err)
	}

	if old.AccountID == t.AccountID {
		delta := t.AmountCents - old.AmountCents
		if delta != 0 {
			_, err = tx.Exec("UPDATE accounts SET balance_cents = balance_cents + ? WHERE id = ?", delta, t.AccountID)
			if err != nil {
				return fmt.Errorf("update balance: %w", err)
			}
		}
	} else {
		_, err = tx.Exec("UPDATE accounts SET balance_cents = balance_cents - ? WHERE id = ?", old.AmountCents, old.AccountID)
		if err != nil {
			return fmt.Errorf("revert old account balance: %w", err)
		}
		_, err = tx.Exec("UPDATE accounts SET balance_cents = balance_cents + ? WHERE id = ?", t.AmountCents, t.AccountID)
		if err != nil {
			return fmt.Errorf("update new account balance: %w", err)
		}
	}

	return tx.Commit()
}

func DeleteTransaction(db *sqlx.DB, id string) error {
	t, err := GetTransaction(db, id)
	if err != nil {
		return fmt.Errorf("get transaction: %w", err)
	}

	tx, err := db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec("DELETE FROM transactions WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("delete transaction: %w", err)
	}

	_, err = tx.Exec("UPDATE accounts SET balance_cents = balance_cents - ? WHERE id = ?", t.AmountCents, t.AccountID)
	if err != nil {
		return fmt.Errorf("update balance: %w", err)
	}

	return tx.Commit()
}
