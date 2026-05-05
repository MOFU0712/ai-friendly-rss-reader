CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  saved_at TEXT NOT NULL,
  UNIQUE(article_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_article_id ON favorites(article_id);
CREATE INDEX IF NOT EXISTS idx_favorites_saved_at ON favorites(saved_at DESC);
