import { useFeeds, useUpdateFeed, useDeleteFeed } from '../hooks/useFeeds';
import type { Feed } from '../types';

export function FeedList() {
  const { data: feeds, isLoading } = useFeeds();
  const updateFeed = useUpdateFeed();
  const deleteFeed = useDeleteFeed();

  if (isLoading) return <p className="text-gray-500 text-sm">読み込み中...</p>;
  if (!feeds?.length)
    return <p className="text-gray-500 text-sm">フィードが登録されていません</p>;

  const handleToggleFavorite = (feed: Feed) => {
    updateFeed.mutate({ id: feed.id, patch: { isFavorite: !feed.isFavorite } });
  };

  const handleDelete = (feed: Feed) => {
    if (window.confirm(`「${feed.title}」を削除しますか？`)) {
      deleteFeed.mutate(feed.id);
    }
  };

  const favorites = feeds.filter((f) => f.isFavorite);
  const others = feeds.filter((f) => !f.isFavorite);

  const renderFeed = (feed: Feed) => (
    <div
      key={feed.id}
      className="flex items-center justify-between rounded border border-gray-200 bg-white p-3"
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => handleToggleFavorite(feed)}
          className="text-lg leading-none flex-shrink-0"
          aria-label={feed.isFavorite ? 'お気に入り解除' : 'お気に入りに追加'}
        >
          {feed.isFavorite ? '★' : '☆'}
        </button>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{feed.title}</p>
          <p className="text-xs text-gray-500 truncate">{feed.url}</p>
          {feed.lastFetchedAt && (
            <p className="text-xs text-gray-400">
              最終取得: {new Date(feed.lastFetchedAt).toLocaleString('ja-JP')}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => handleDelete(feed)}
        className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0"
        aria-label="削除"
      >
        ✕
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {favorites.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-500 mb-2">★ お気に入り</h3>
          <div className="space-y-2">{favorites.map(renderFeed)}</div>
        </section>
      )}
      {others.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-500 mb-2">その他</h3>
          <div className="space-y-2">{others.map(renderFeed)}</div>
        </section>
      )}
    </div>
  );
}
