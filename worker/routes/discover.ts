import { Hono } from 'hono';
import type { Env } from '../types';
import { discoverFeeds } from '../lib/feedDiscovery';

export const discoverRouter = new Hono<{ Bindings: Env }>();

discoverRouter.get('/', async (c) => {
  const url = c.req.query('url');
  if (!url) return c.json({ error: 'url is required' }, 400);

  try {
    new URL(url);
  } catch {
    return c.json({ error: 'Invalid URL' }, 400);
  }

  try {
    const feeds = await discoverFeeds(url);
    return c.json({ data: { feeds } });
  } catch {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});
