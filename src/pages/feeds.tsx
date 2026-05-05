import { Link } from 'react-router-dom';
import { FeedForm } from '../components/FeedForm';
import { FeedList } from '../components/FeedList';

export function FeedsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/" className="text-gray-600 hover:text-gray-900">
          ← 戻る
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">フィード管理</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <FeedForm />
        <FeedList />
      </main>
    </div>
  );
}
