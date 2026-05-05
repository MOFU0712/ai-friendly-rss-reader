import type { Article } from '../types';
import { ArticleCard } from './ArticleCard';

type Props = {
  articles: Article[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
};

export function ArticleList({ articles, selectedIds, onToggle }: Props) {
  const favoriteArticles = articles.filter((a) => a.feedIsFavorite);
  const otherArticles = articles.filter((a) => !a.feedIsFavorite);

  if (articles.length === 0) {
    return <p className="text-center text-gray-500 py-12">未読の記事はありません</p>;
  }

  return (
    <div className="space-y-6">
      {favoriteArticles.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            ★ お気に入り
          </h2>
          <div className="space-y-2">
            {favoriteArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isSelected={selectedIds.has(article.id)}
                onToggle={onToggle}
              />
            ))}
          </div>
        </section>
      )}
      {otherArticles.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            その他
          </h2>
          <div className="space-y-2">
            {otherArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isSelected={selectedIds.has(article.id)}
                onToggle={onToggle}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
