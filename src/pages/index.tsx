import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useArticles, useFetchFeeds } from '../hooks/useArticles';
import { useSelection } from '../hooks/useSelection';
import { ArticleList } from '../components/ArticleList';
import { CopyBar } from '../components/CopyBar';
import { Toast } from '../components/Toast';

export function ArticlesPage() {
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { data: articles = [], isLoading, error } = useArticles(unreadOnly);
  const { selectedIds, toggle, clear } = useSelection();
  const fetchFeeds = useFetchFeeds();

  const selectedArticles = articles.filter((a) => selectedIds.has(a.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-gray-900">🗞 RSS Reader</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              fetchFeeds.mutate(undefined, {
                onSuccess: () => setToastMessage('フィードを更新しました'),
                onError: () => setToastMessage('更新に失敗しました'),
              });
            }}
            disabled={fetchFeeds.isPending}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            {fetchFeeds.isPending ? '更新中...' : '更新'}
          </button>
          <button
            onClick={() => setUnreadOnly((v) => !v)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {unreadOnly ? '未読のみ ●' : '全て表示 ○'}
          </button>
          <Link to="/feeds" className="text-sm text-blue-600 hover:text-blue-700">
            フィード管理
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {isLoading && <p className="text-center text-gray-500 py-12">読み込み中...</p>}
        {error && (
          <p className="text-center text-red-500 py-12">記事の取得に失敗しました</p>
        )}
        {!isLoading && !error && (
          <ArticleList articles={articles} selectedIds={selectedIds} onToggle={toggle} />
        )}
      </main>

      <CopyBar
        articles={selectedArticles}
        onCopy={() => {
          setToastMessage('コピーしました ✓');
          clear();
        }}
        onClear={clear}
      />

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}
