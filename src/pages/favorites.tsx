import { Link } from 'react-router-dom';
import { useFavorites } from '../hooks/useArticles';
import { ArticleList } from '../components/ArticleList';

export function FavoritesPage() {
  const { data: articles = [], isLoading, error } = useFavorites();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-gray-900">お気に入り</h1>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-700">
            記事一覧
          </Link>
          <Link to="/feeds" className="text-sm text-blue-600 hover:text-blue-700">
            フィード管理
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading && <p className="text-center text-gray-500 py-12">読み込み中...</p>}
        {error && (
          <p className="text-center text-red-500 py-12">お気に入りの取得に失敗しました</p>
        )}
        {!isLoading && !error && articles.length === 0 && (
          <p className="text-center text-gray-500 py-12">
            お気に入りはまだありません。
            <br />
            記事を選択してコピーすると自動的に保存されます。
          </p>
        )}
        {!isLoading && !error && articles.length > 0 && (
          <ArticleList
            articles={articles}
            selectedIds={new Set()}
            onToggle={() => {}}
          />
        )}
      </main>
    </div>
  );
}
