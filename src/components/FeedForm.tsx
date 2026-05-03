import { useState } from 'react';
import { useCreateFeed } from '../hooks/useFeeds';

type Props = {
  onSuccess?: () => void;
};

export function FeedForm({ onSuccess }: Props) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createFeed = useCreateFeed();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    createFeed.mutate(url.trim(), {
      onSuccess: () => {
        setUrl('');
        onSuccess?.();
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : '登録に失敗しました');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="RSS フィード URL を入力..."
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          disabled={createFeed.isPending}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {createFeed.isPending ? '追加中...' : '+ 追加'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
