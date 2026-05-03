import { describe, it, expect } from 'vitest';
import { parseFeed } from './rss';

describe('parseFeed', () => {
  it('is a function', () => {
    expect(typeof parseFeed).toBe('function');
  });
});
