import type { Article } from '../types';

export function exportToMarkdown(articles: Article[]): string {
  return articles.map((a) => `- [${a.title}](${a.url})`).join('\n');
}
