import { Hono } from 'hono';
import type { Env } from '../types';
import { getFeeds, insertFeed, updateFeed, deleteFeed } from '../lib/db';
import { parseFeed } from '../lib/rss';

export const feedsRouter = new Hono<{ Bindings: Env }>();

feedsRouter.get('/', async (c) => {
  try {
    const feeds = await getFeeds(c.env.DB);
    return c.json({ data: feeds });
  } catch {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

feedsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json<{ url?: string }>();
    if (!body.url) return c.json({ error: 'url is required' }, 400);

    let title = body.url;
    try {
      const parsed = await parseFeed(body.url);
      title = parsed.title;
    } catch {
      // タイトル取得失敗時はURLをタイトルとして使用
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await insertFeed(c.env.DB, { id, url: body.url, title, createdAt });

    return c.json(
      {
        data: {
          id,
          url: body.url,
          title,
          isFavorite: false,
          fetchOrder: 0,
          createdAt,
          lastFetchedAt: null,
        },
      },
      201,
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'このURLはすでに登録されています' }, 400);
    }
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

feedsRouter.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{ isFavorite?: boolean; title?: string }>();
    await updateFeed(c.env.DB, id, body);
    return c.json({ data: { id } });
  } catch {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

feedsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await deleteFeed(c.env.DB, id);
    return c.json({ data: { id } });
  } catch {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});
