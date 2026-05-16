import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { feedsRouter } from './routes/feeds';
import { articlesRouter } from './routes/articles';
import { discoverRouter } from './routes/discover';
import { fetchAllFeeds } from './cron/fetchFeeds';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// discoverRouter must be mounted before feedsRouter to avoid path conflicts
app.route('/api/feeds/discover', discoverRouter);
app.route('/api/feeds', feedsRouter);
app.route('/api/articles', articlesRouter);

app.post('/api/cron/fetch', async (c) => {
  try {
    await fetchAllFeeds(c.env);
    return c.json({ data: { message: 'Feed fetch triggered' } });
  } catch {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, _: ExecutionContext): Promise<void> {
    await fetchAllFeeds(env);
  },
};
