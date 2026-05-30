CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT REFERENCES categories(id),
    icon TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#6366f1'
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
