import type { Env } from '../types';
import { getFeeds, insertArticle, updateFeed } from '../lib/db';
import { parseFeed } from '../lib/rss';

export async function fetchAllFeeds(env: Env): Promise<void> {
  const feeds = await getFeeds(env.DB);

  for (const feed of feeds) {
    try {
      const parsed = await parseFeed(feed.url);
      const now = new Date().toISOString();

      for (const entry of parsed.entries) {
        if (!entry.guid || !entry.url) continue;
        await insertArticle(env.DB, {
          id: crypto.randomUUID(),
          feedId: feed.id,
          guid: entry.guid,
          title: entry.title,
          url: entry.url,
          summary: entry.summary,
          author: entry.author,
          publishedAt: entry.publishedAt,
          fetchedAt: now,
        });
      }

      await updateFeed(env.DB, feed.id, { lastFetchedAt: now });
    } catch (error) {
      console.error(`Failed to fetch feed ${feed.url}:`, error);
    }
  }
}
