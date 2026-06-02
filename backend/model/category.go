package model

import (
	"github.com/jmoiron/sqlx"
	"github.com/oklog/ulid/v2"
)

type Category struct {
	ID       string  `db:"id" json:"id"`
	Name     string  `db:"name" json:"name"`
	ParentID *string `db:"parent_id" json:"parent_id,omitempty"`
	Icon     string  `db:"icon" json:"icon"`
	Color    string  `db:"color" json:"color"`
	UserID   string  `db:"user_id" json:"-"`
}

func CreateCategory(db *sqlx.DB, c *Category, userID string) error {
	c.ID = ulid.Make().String()
	c.UserID = userID
	_, err := db.Exec(
		`INSERT INTO categories (id, name, parent_id, icon, color, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
		c.ID, c.Name, c.ParentID, c.Icon, c.Color, c.UserID,
	)
	return err
}

func GetCategory(db *sqlx.DB, id, userID string) (*Category, error) {
	var c Category
	err := db.Get(&c, "SELECT * FROM categories WHERE id = ? AND "+userScope(""), id, userID)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func ListCategories(db *sqlx.DB, userID string) ([]Category, error) {
	var cats []Category
	err := db.Select(&cats, "SELECT * FROM categories WHERE "+userScope("")+" ORDER BY name", userID)
	if err != nil {
		return nil, err
	}
	return cats, nil
}

func UpdateCategory(db *sqlx.DB, c *Category, userID string) error {
	_, err := db.Exec(
		`UPDATE categories SET name = ?, parent_id = ?, icon = ?, color = ? WHERE id = ? AND `+userScope(""),
		c.Name, c.ParentID, c.Icon, c.Color, c.ID, userID,
	)
	return err
}

func DeleteCategory(db *sqlx.DB, id, userID string) error {
	_, err := db.Exec("DELETE FROM categories WHERE id = ? AND "+userScope(""), id, userID)
	return err
}
