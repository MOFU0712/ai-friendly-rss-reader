export type Feed = {
  id: string;
  url: string;
  title: string;
  isFavorite: boolean;
  fetchOrder: number;
  createdAt: string;
  lastFetchedAt: string | null;
};

export type Article = {
  id: string;
  feedId: string;
  feedTitle: string;
  feedIsFavorite: boolean;
  guid: string;
  title: string;
  url: string;
  summary: string | null;
  author: string | null;
  publishedAt: string;
  fetchedAt: string;
  isRead: boolean;
};
