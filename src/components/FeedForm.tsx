import { useState, useRef, useEffect } from 'react';
import { useCreateFeed, useDiscoverFeed } from '../hooks/useFeeds';

type Candidate = { url: string; title: string };

type Props = {
  onSuccess?: () => void;
};

export function FeedForm({ onSuccess }: Props) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const createFeed = useCreateFeed();
  const discoverFeed = useDiscoverFeed();

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setError(null);
    setSuccessMsg(null);
    setCandidates([]);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    try {
      new URL(value);
    } catch {
      return;
    }

    const currentId = ++requestIdRef.current;
    debounceTimer.current = setTimeout(() => {
      discoverFeed.mutate(value.trim(), {
        onSuccess: (data) => {
          if (requestIdRef.current !== currentId) return;
          if (data.feeds.length === 1) {
            setUrl(data.feeds[0].url);
            setSuccessMsg('RSSフィードを検出しました');
          } else if (data.feeds.length > 1) {
            setCandidates(data.feeds);
          } else {
            setError('RSSフィードが見つかりませんでした。URLを直接入力してください。');
          }
        },
        onError: () => {
          if (requestIdRef.current !== currentId) return;
          setError('RSS検出中にエラーが発生しました');
        },
      });
    }, 500);
  };

  const handleCandidateSelect = (candidateUrl: string) => {
    setUrl(candidateUrl);
    setCandidates([]);
    setError(null);
    setSuccessMsg('RSSフィードを検出しました');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    setSuccessMsg(null);
    createFeed.mutate(url.trim(), {
      onSuccess: () => {
        setUrl('');
        setCandidates([]);
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
        <div className="relative flex-1">
          <input
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="サイトまたはRSSフィードのURLを入力..."
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
            required
          />
          {discoverFeed.isPending && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              検索中...
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={createFeed.isPending || discoverFeed.isPending}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {createFeed.isPending ? '追加中...' : '+ 追加'}
        </button>
      </div>

      {candidates.length > 1 && (
        <ul className="rounded border border-gray-200 divide-y divide-gray-100 text-sm bg-white shadow-sm">
          {candidates.map((c) => (
            <li key={c.url}>
              <button
                type="button"
                onClick={() => handleCandidateSelect(c.url)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50"
              >
                <span className="font-medium">{c.title || c.url}</span>
                <span className="block text-xs text-gray-400 truncate">{c.url}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {successMsg && <p className="text-xs text-green-600">{successMsg}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
