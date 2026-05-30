package model

import (
	"database/sql"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/oklog/ulid/v2"
)

type Account struct {
	ID            string `db:"id" json:"id"`
	Name          string `db:"name" json:"name"`
	Type          string `db:"type" json:"type"`
	BalanceCents  int64  `db:"balance_cents" json:"balance_cents"`
	Currency      string `db:"currency" json:"currency"`
	CreatedAt     string `db:"created_at" json:"created_at"`
	Archived      bool   `db:"archived" json:"archived"`
}

func CreateAccount(db *sqlx.DB, a *Account) error {
	a.ID = ulid.Make().String()
	a.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	_, err := db.Exec(
		`INSERT INTO accounts (id, name, type, balance_cents, currency, created_at, archived)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		a.ID, a.Name, a.Type, a.BalanceCents, a.Currency, a.CreatedAt, a.Archived,
	)
	return err
}

func GetAccount(db *sqlx.DB, id string) (*Account, error) {
	var a Account
	err := db.Get(&a, "SELECT * FROM accounts WHERE id = ?", id)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func ListAccounts(db *sqlx.DB) ([]Account, error) {
	var accounts []Account
	err := db.Select(&accounts, "SELECT * FROM accounts WHERE archived = 0 ORDER BY name")
	if err != nil {
		return nil, err
	}
	return accounts, nil
}

func UpdateAccount(db *sqlx.DB, a *Account) error {
	_, err := db.Exec(
		`UPDATE accounts SET name = ?, type = ?, balance_cents = ?, currency = ? WHERE id = ?`,
		a.Name, a.Type, a.BalanceCents, a.Currency, a.ID,
	)
	return err
}

func ArchiveAccount(db *sqlx.DB, id string) error {
	_, err := db.Exec("UPDATE accounts SET archived = 1 WHERE id = ?", id)
	return err
}

func UpdateAccountBalance(db *sqlx.DB, accountID string, delta int64) error {
	_, err := db.Exec("UPDATE accounts SET balance_cents = balance_cents + ? WHERE id = ?", delta, accountID)
	return err
}

func NullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}
