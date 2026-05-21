import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { feedsRouter } from './routes/feeds';
import { articlesRouter } from './routes/articles';
import { discoverRouter } from './routes/discover';
import { fetchAllFeeds } from './cron/fetchFeeds';

const app = new Hono<{ Bindings: Env }>();

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error', details: String(err) }, 500);
});

app.use('*', cors());

// discoverRouter must be mounted before feedsRouter to avoid path conflicts
app.route('/api/feeds/discover', discoverRouter);
app.route('/api/feeds', feedsRouter);
app.route('/api/articles', articlesRouter);

app.post('/api/cron/fetch', async (c) => {
  try {
    await fetchAllFeeds(c.env);
    return c.json({ data: { message: 'Feed fetch triggered' } });
  } catch (e) {
    console.error('cron/fetch error:', e);
    return c.json({ error: 'Internal Server Error', details: String(e) }, 500);
  }
});

// SPA fallback: serve index.html for non-API routes
app.get('*', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = '/index.html';
  return c.env.ASSETS.fetch(new Request(url.toString(), c.req.raw));
});

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => app.fetch(request, env, ctx),
  async scheduled(_event: ScheduledEvent, env: Env, _: ExecutionContext): Promise<void> {
    await fetchAllFeeds(env);
  },
};
