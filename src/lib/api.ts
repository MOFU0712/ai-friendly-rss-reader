import type { Feed, Article } from '../types';

const BASE_URL = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const json = (await res.json()) as { data?: T; error?: string };
  if (!res.ok || json.error) throw new Error(json.error ?? 'Request failed');
  return json.data as T;
}

export const api = {
  feeds: {
    list: () => request<Feed[]>('/feeds'),
    create: (url: string) =>
      request<Feed>('/feeds', {
        method: 'POST',
        body: JSON.stringify({ url }),
      }),
    update: (id: string, patch: Partial<Pick<Feed, 'isFavorite' | 'title'>>) =>
      request<{ id: string }>(`/feeds/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    delete: (id: string) =>
      request<{ id: string }>(`/feeds/${id}`, { method: 'DELETE' }),
  },
  articles: {
    list: (params?: { unreadOnly?: boolean; limit?: number; offset?: number }) => {
      const query = new URLSearchParams();
      if (params?.unreadOnly !== undefined) query.set('unread_only', String(params.unreadOnly));
      if (params?.limit !== undefined) query.set('limit', String(params.limit));
      if (params?.offset !== undefined) query.set('offset', String(params.offset));
      const qs = query.toString();
      return request<Article[]>(`/articles${qs ? `?${qs}` : ''}`);
    },
    markRead: (id: string) =>
      request<{ id: string }>(`/articles/${id}/read`, { method: 'POST' }),
    markMultipleRead: (articleIds: string[]) =>
      request<{ marked: number }>('/articles/read', {
        method: 'POST',
        body: JSON.stringify({ articleIds }),
      }),
    saveFavorites: (articleIds: string[]) =>
      request<{ saved: number }>('/articles/favorites', {
        method: 'POST',
        body: JSON.stringify({ articleIds }),
      }),
    listFavorites: (params?: { limit?: number; offset?: number }) => {
      const query = new URLSearchParams();
      if (params?.limit !== undefined) query.set('limit', String(params.limit));
      if (params?.offset !== undefined) query.set('offset', String(params.offset));
      const qs = query.toString();
      return request<Article[]>(`/articles/favorites${qs ? `?${qs}` : ''}`);
    },
  },
  cron: {
    fetch: () => request<{ message: string }>('/cron/fetch', { method: 'POST' }),
  },
};
