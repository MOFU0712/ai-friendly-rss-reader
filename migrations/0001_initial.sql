CREATE TABLE IF NOT EXISTS feeds (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  fetch_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  last_fetched_at TEXT
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  feed_id TEXT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  guid TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  summary TEXT,
  author TEXT,
  published_at TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  UNIQUE(feed_id, guid)
);

CREATE TABLE IF NOT EXISTS read_history (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  read_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles(feed_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_read_history_article_id ON read_history(article_id);
