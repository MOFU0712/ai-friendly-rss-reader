import type { Article } from '../types';
import { exportToMarkdown } from '../lib/markdown';
import { api } from '../lib/api';
import { useMarkMultipleRead } from '../hooks/useArticles';

type Props = {
  articles: Article[];
  onCopy: () => void;
  onClear: () => void;
};

export function CopyBar({ articles, onCopy, onClear }: Props) {
  const markMultipleRead = useMarkMultipleRead();

  if (articles.length === 0) return null;

  const unreadArticles = articles.filter((a) => !a.isRead);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportToMarkdown(articles));
      await api.articles.saveFavorites(articles.map((a) => a.id));
      onCopy();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkRead = () => {
    markMultipleRead.mutate(
      unreadArticles.map((a) => a.id),
      { onSuccess: onClear },
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between shadow-lg z-10">
      <span className="text-sm text-gray-600">選択中: {articles.length}件</span>
      <div className="flex gap-2">
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          選択解除
        </button>
        {unreadArticles.length > 0 && (
          <button
            onClick={handleMarkRead}
            disabled={markMultipleRead.isPending}
            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {markMultipleRead.isPending ? '処理中...' : '一括既読'}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          クリップボードにコピー
        </button>
      </div>
    </div>
  );
}
