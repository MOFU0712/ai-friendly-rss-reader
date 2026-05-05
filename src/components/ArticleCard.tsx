import { clsx } from 'clsx';
import type { Article } from '../types';
import { useMarkRead } from '../hooks/useArticles';

type Props = {
  article: Article;
  isSelected: boolean;
  onToggle: (id: string) => void;
};

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  return `${days}日前`;
}

export function ArticleCard({ article, isSelected, onToggle }: Props) {
  const markRead = useMarkRead();

  const handleTitleClick = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
    markRead.mutate(article.id);
  };

  return (
    <div
      className={clsx(
        'rounded-lg border p-4 transition-colors',
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white',
        article.isRead && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(article.id)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span className="truncate">{article.feedTitle}</span>
            <span>·</span>
            <span className="whitespace-nowrap">{formatTimeAgo(new Date(article.publishedAt))}</span>
          </div>
          <button
            onClick={handleTitleClick}
            className="text-left text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline line-clamp-2"
          >
            {article.title}
          </button>
          {article.summary && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{article.summary}</p>
          )}
        </div>
      </div>
    </div>
  );
}
