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
}

func CreateCategory(db *sqlx.DB, c *Category) error {
	c.ID = ulid.Make().String()
	_, err := db.Exec(
		`INSERT INTO categories (id, name, parent_id, icon, color) VALUES (?, ?, ?, ?, ?)`,
		c.ID, c.Name, c.ParentID, c.Icon, c.Color,
	)
	return err
}

func GetCategory(db *sqlx.DB, id string) (*Category, error) {
	var c Category
	err := db.Get(&c, "SELECT * FROM categories WHERE id = ?", id)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func ListCategories(db *sqlx.DB) ([]Category, error) {
	var cats []Category
	err := db.Select(&cats, "SELECT * FROM categories ORDER BY name")
	if err != nil {
		return nil, err
	}
	return cats, nil
}

func UpdateCategory(db *sqlx.DB, c *Category) error {
	_, err := db.Exec(
		`UPDATE categories SET name = ?, parent_id = ?, icon = ?, color = ? WHERE id = ?`,
		c.Name, c.ParentID, c.Icon, c.Color, c.ID,
	)
	return err
}

func DeleteCategory(db *sqlx.DB, id string) error {
	_, err := db.Exec("DELETE FROM categories WHERE id = ?", id)
	return err
}
