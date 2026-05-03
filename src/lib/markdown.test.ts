import { describe, it, expect } from 'vitest';
import { exportToMarkdown } from './markdown';
import type { Article } from '../types';

const makeArticle = (overrides: Partial<Article> = {}): Article => ({
  id: '1',
  feedId: 'f1',
  feedTitle: 'Test Feed',
  feedIsFavorite: false,
  guid: 'g1',
  title: 'Article One',
  url: 'https://example.com/1',
  summary: null,
  author: null,
  publishedAt: '2024-01-01T00:00:00.000Z',
  fetchedAt: '2024-01-01T01:00:00.000Z',
  isRead: false,
  ...overrides,
});

describe('exportToMarkdown', () => {
  it('記事をMarkdownリスト形式に変換する', () => {
    const articles = [
      makeArticle({ id: '1', title: 'Article One', url: 'https://example.com/1' }),
      makeArticle({ id: '2', title: 'Article Two', url: 'https://example.com/2' }),
    ];
    expect(exportToMarkdown(articles)).toBe(
      '- [Article One](https://example.com/1)\n- [Article Two](https://example.com/2)',
    );
  });

  it('空配列の場合は空文字列を返す', () => {
    expect(exportToMarkdown([])).toBe('');
  });

  it('タイトルにMarkdown特殊文字が包まれる場合も正しく出力する', () => {
    const articles = [makeArticle({ title: '[special] & <chars>', url: 'https://example.com/s' })];
    expect(exportToMarkdown(articles)).toBe('- [[special] & <chars>](https://example.com/s)');
  });
});
