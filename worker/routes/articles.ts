import { Hono } from 'hono';
import type { Env } from '../types';
import { getArticles, markAsRead, markMultipleAsRead, saveFavorites, getFavorites } from '../lib/db';

export const articlesRouter = new Hono<{ Bindings: Env }>();

articlesRouter.get('/', async (c) => {
  try {
    const unreadOnly = c.req.query('unread_only') !== 'false';
    const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);
    const offset = Number(c.req.query('offset') ?? 0);
    const articles = await getArticles(c.env.DB, { unreadOnly, limit, offset });
    return c.json({ data: articles });
  } catch (e) {
    console.error('getArticles error:', e);
    return c.json({ error: 'Internal Server Error', details: String(e) }, 500);
  }
});

articlesRouter.post('/read', async (c) => {
  try {
    const body = await c.req.json<{ articleIds: string[] }>();
    if (!Array.isArray(body.articleIds)) {
      return c.json({ error: 'articleIds must be an array' }, 400);
    }
    await markMultipleAsRead(c.env.DB, body.articleIds);
    return c.json({ data: { marked: body.articleIds.length } });
  } catch {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

articlesRouter.post('/:id/read', async (c) => {
  try {
    const id = c.req.param('id');
    await markAsRead(c.env.DB, id);
    return c.json({ data: { id } });
  } catch {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

articlesRouter.get('/favorites', async (c) => {
  try {
    const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);
    const offset = Number(c.req.query('offset') ?? 0);
    const articles = await getFavorites(c.env.DB, { limit, offset });
    return c.json({ data: articles });
  } catch {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

articlesRouter.post('/favorites', async (c) => {
  try {
    const body = await c.req.json<{ articleIds: string[] }>();
    if (!Array.isArray(body.articleIds)) {
      return c.json({ error: 'articleIds must be an array' }, 400);
    }
    await saveFavorites(c.env.DB, body.articleIds);
    return c.json({ data: { saved: body.articleIds.length } });
  } catch {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});
