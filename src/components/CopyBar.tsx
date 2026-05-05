import type { Article } from '../types';
import { exportToMarkdown } from '../lib/markdown';

type Props = {
  articles: Article[];
  onCopy: () => void;
  onClear: () => void;
};

export function CopyBar({ articles, onCopy, onClear }: Props) {
  if (articles.length === 0) return null;

  const handleCopy = () => {
    navigator.clipboard
      .writeText(exportToMarkdown(articles))
      .then(onCopy)
      .catch(console.error);
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
