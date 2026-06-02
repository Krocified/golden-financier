package model

import (
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/oklog/ulid/v2"
)

func userScope(alias string) string {
	if alias != "" {
		return "(" + alias + ".user_id = '' OR " + alias + ".user_id = ?)"
	}
	return "(user_id = '' OR user_id = ?)"
}

type Account struct {
	ID           string `db:"id" json:"id"`
	Name         string `db:"name" json:"name"`
	Type         string `db:"type" json:"type"`
	BalanceCents int64  `db:"balance_cents" json:"balance_cents"`
	Currency     string `db:"currency" json:"currency"`
	CreatedAt    string `db:"created_at" json:"created_at"`
	Archived     bool   `db:"archived" json:"archived"`
	UserID       string `db:"user_id" json:"-"`
}

func CreateAccount(db *sqlx.DB, a *Account, userID string) error {
	a.ID = ulid.Make().String()
	a.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	a.UserID = userID
	if a.Currency == "" {
		a.Currency = "IDR"
	}
	_, err := db.Exec(
		`INSERT INTO accounts (id, name, type, balance_cents, currency, created_at, archived, user_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		a.ID, a.Name, a.Type, a.BalanceCents, a.Currency, a.CreatedAt, a.Archived, a.UserID,
	)
	return err
}

func GetAccount(db *sqlx.DB, id, userID string) (*Account, error) {
	var a Account
	err := db.Get(&a, "SELECT * FROM accounts WHERE id = ? AND "+userScope(""), id, userID)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func ListAccounts(db *sqlx.DB, userID string) ([]Account, error) {
	var accounts []Account
	err := db.Select(&accounts, "SELECT * FROM accounts WHERE archived = 0 AND "+userScope("")+" ORDER BY name", userID)
	if err != nil {
		return nil, err
	}
	return accounts, nil
}

func UpdateAccount(db *sqlx.DB, a *Account, userID string) error {
	_, err := db.Exec(
		`UPDATE accounts SET name = ?, type = ?, balance_cents = ?, currency = ? WHERE id = ? AND `+userScope(""),
		a.Name, a.Type, a.BalanceCents, a.Currency, a.ID, userID,
	)
	return err
}

func ArchiveAccount(db *sqlx.DB, id, userID string) error {
	_, err := db.Exec("UPDATE accounts SET archived = 1 WHERE id = ? AND "+userScope(""), id, userID)
	return err
}

func UpdateAccountBalance(db *sqlx.DB, accountID string, delta int64) error {
	_, err := db.Exec("UPDATE accounts SET balance_cents = balance_cents + ? WHERE id = ?", delta, accountID)
	return err
}
