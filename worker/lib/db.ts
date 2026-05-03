import type { Feed, Article } from '../../src/types';

type FeedRow = {
  id: string;
  url: string;
  title: string;
  is_favorite: number;
  fetch_order: number;
  created_at: string;
  last_fetched_at: string | null;
};

type ArticleRow = {
  id: string;
  feed_id: string;
  feed_title: string;
  feed_is_favorite: number;
  guid: string;
  title: string;
  url: string;
  summary: string | null;
  author: string | null;
  published_at: string;
  fetched_at: string;
  is_read: number;
};

function toFeed(row: FeedRow): Feed {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    isFavorite: row.is_favorite === 1,
    fetchOrder: row.fetch_order,
    createdAt: row.created_at,
    lastFetchedAt: row.last_fetched_at,
  };
}

function toArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    feedId: row.feed_id,
    feedTitle: row.feed_title,
    feedIsFavorite: row.feed_is_favorite === 1,
    guid: row.guid,
    title: row.title,
    url: row.url,
    summary: row.summary,
    author: row.author,
    publishedAt: row.published_at,
    fetchedAt: row.fetched_at,
    isRead: row.is_read === 1,
  };
}

export async function getFeeds(db: D1Database): Promise<Feed[]> {
  const result = await db
    .prepare('SELECT * FROM feeds ORDER BY is_favorite DESC, fetch_order ASC, created_at ASC')
    .all<FeedRow>();
  return result.results.map(toFeed);
}

export async function getFeedById(db: D1Database, id: string): Promise<Feed | null> {
  const row = await db.prepare('SELECT * FROM feeds WHERE id = ?').bind(id).first<FeedRow>();
  return row ? toFeed(row) : null;
}

export async function insertFeed(
  db: D1Database,
  feed: { id: string; url: string; title: string; isFavorite?: boolean; fetchOrder?: number; createdAt: string },
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO feeds (id, url, title, is_favorite, fetch_order, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(feed.id, feed.url, feed.title, feed.isFavorite ? 1 : 0, feed.fetchOrder ?? 0, feed.createdAt)
    .run();
}

export async function updateFeed(
  db: D1Database,
  id: string,
  patch: { title?: string; isFavorite?: boolean; fetchOrder?: number; lastFetchedAt?: string | null },
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (patch.title !== undefined) {
    sets.push('title = ?');
    values.push(patch.title);
  }
  if (patch.isFavorite !== undefined) {
    sets.push('is_favorite = ?');
    values.push(patch.isFavorite ? 1 : 0);
  }
  if (patch.fetchOrder !== undefined) {
    sets.push('fetch_order = ?');
    values.push(patch.fetchOrder);
  }
  if (patch.lastFetchedAt !== undefined) {
    sets.push('last_fetched_at = ?');
    values.push(patch.lastFetchedAt);
  }

  if (sets.length === 0) return;

  values.push(id);
  await db
    .prepare(`UPDATE feeds SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function deleteFeed(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM feeds WHERE id = ?').bind(id).run();
}

export async function getArticles(
  db: D1Database,
  options: { unreadOnly?: boolean; limit?: number; offset?: number },
): Promise<Article[]> {
  const { unreadOnly = true, limit = 50, offset = 0 } = options;

  let query = `
    SELECT
      a.*,
      f.title AS feed_title,
      f.is_favorite AS feed_is_favorite,
      CASE WHEN rh.id IS NOT NULL THEN 1 ELSE 0 END AS is_read
    FROM articles a
    JOIN feeds f ON a.feed_id = f.id
    LEFT JOIN read_history rh ON rh.article_id = a.id
  `;

  if (unreadOnly) query += ' WHERE rh.id IS NULL';
  query += ' ORDER BY f.is_favorite DESC, a.published_at DESC LIMIT ? OFFSET ?';

  const result = await db.prepare(query).bind(limit, offset).all<ArticleRow>();
  return result.results.map(toArticle);
}

export async function insertArticle(
  db: D1Database,
  article: {
    id: string;
    feedId: string;
    guid: string;
    title: string;
    url: string;
    summary: string | null;
    author: string | null;
    publishedAt: string;
    fetchedAt: string;
  },
): Promise<void> {
  await db
    .prepare(
      'INSERT OR IGNORE INTO articles (id, feed_id, guid, title, url, summary, author, published_at, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      article.id,
      article.feedId,
      article.guid,
      article.title,
      article.url,
      article.summary,
      article.author,
      article.publishedAt,
      article.fetchedAt,
    )
    .run();
}

export async function markAsRead(db: D1Database, articleId: string): Promise<void> {
  await db
    .prepare('INSERT OR IGNORE INTO read_history (id, article_id, read_at) VALUES (?, ?, ?)')
    .bind(crypto.randomUUID(), articleId, new Date().toISOString())
    .run();
}
