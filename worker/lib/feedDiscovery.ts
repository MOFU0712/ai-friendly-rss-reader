import { parseFeed } from './rss';

export type DiscoveredFeed = { url: string; title: string };

const COMMON_PATHS = [
  '/feed',
  '/rss',
  '/feed.xml',
  '/atom.xml',
  '/rss.xml',
  '/index.xml',
  '/feed/rss',
];

export async function discoverFeeds(siteUrl: string): Promise<DiscoveredFeed[]> {
  // Step 1: Try the input URL directly as an RSS feed
  try {
    const parsed = await parseFeed(siteUrl);
    return [{ url: siteUrl, title: parsed.title }];
  } catch {
    // Not a direct RSS feed, continue
  }

  // Step 2: Fetch HTML and extract <link rel="alternate"> tags via HTMLRewriter
  try {
    const htmlFeeds = await discoverFromHtml(siteUrl);
    if (htmlFeeds.length > 0) return htmlFeeds;
  } catch {
    // HTML discovery failed, fall through to common paths
  }

  // Step 3: Probe common paths under the same origin
  const origin = new URL(siteUrl).origin;
  for (const path of COMMON_PATHS) {
    try {
      const candidateUrl = `${origin}${path}`;
      const parsed = await parseFeed(candidateUrl);
      return [{ url: candidateUrl, title: parsed.title }];
    } catch {
      // Try next path
    }
  }

  return [];
}

async function discoverFromHtml(siteUrl: string): Promise<DiscoveredFeed[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(siteUrl, { signal: controller.signal });
    if (!res.ok) return [];

    const feedLinks: { href: string; title: string }[] = [];

    await new HTMLRewriter()
      .on('link', {
        element(el) {
          const rel = el.getAttribute('rel');
          const type = el.getAttribute('type');
          const href = el.getAttribute('href');
          if (
            rel === 'alternate' &&
            (type === 'application/rss+xml' || type === 'application/atom+xml') &&
            href
          ) {
            feedLinks.push({ href, title: el.getAttribute('title') ?? '' });
          }
        },
      })
      .transform(res)
      .text();

    if (feedLinks.length === 0) return [];

    const results: DiscoveredFeed[] = [];
    for (const { href, title } of feedLinks) {
      const absoluteUrl = new URL(href, siteUrl).href;
      try {
        const parsed = await parseFeed(absoluteUrl);
        results.push({ url: absoluteUrl, title: parsed.title || title || absoluteUrl });
      } catch {
        if (title) results.push({ url: absoluteUrl, title });
      }
    }
    return results;
  } finally {
    clearTimeout(timeoutId);
  }
}
