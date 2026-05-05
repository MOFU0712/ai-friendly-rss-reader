import { extract } from '@extractus/feed-extractor';

export type ParsedFeed = {
  title: string;
  entries: ParsedEntry[];
};

export type ParsedEntry = {
  guid: string;
  title: string;
  url: string;
  summary: string | null;
  author: string | null;
  publishedAt: string;
};

function parsePublishedAt(published: Date | string | undefined): string {
  if (!published) return new Date().toISOString();
  if (published instanceof Date) return published.toISOString();
  const d = new Date(published);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function parseAuthor(author: unknown): string | null {
  if (!author) return null;
  if (typeof author === 'string') return author;
  if (typeof author === 'object' && author !== null && 'name' in author) {
    return (author as { name: string }).name ?? null;
  }
  return null;
}

export async function parseFeed(url: string): Promise<ParsedFeed> {
  const result = await extract(url);
  if (!result) throw new Error(`Failed to parse feed: ${url}`);

  const title = result.title ?? url;
  const entries: ParsedEntry[] = (result.entries ?? []).map((entry) => ({
    guid: entry.id ?? entry.link ?? '',
    title: entry.title ?? '(no title)',
    url: entry.link ?? '',
    summary: entry.description ?? null,
    author: parseAuthor((entry as Record<string, unknown>)['author']),
    publishedAt: parsePublishedAt(entry.published as Date | string | undefined),
  }));

  return { title, entries };
}
