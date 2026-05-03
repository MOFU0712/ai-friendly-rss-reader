import { Hono } from 'hono';
import type { Env } from '../types';
import { getArticles, markAsRead } from '../lib/db';

export const articlesRouter = new Hono<{ Bindings: Env }>();

articlesRouter.get('/', async (c) => {
  try {
    const unreadOnly = c.req.query('unread_only') !== 'false';
    const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);
    const offset = Number(c.req.query('offset') ?? 0);
    const articles = await getArticles(c.env.DB, { unreadOnly, limit, offset });
    return c.json({ data: articles });
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
