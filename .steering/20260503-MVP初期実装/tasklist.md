# タスクリスト — MVP初期実装

## ステータス凡例
- [ ] 未着手
- [x] 完了

---

## 1. プロジェクト初期設定

- [x] `package.json` 作成（React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Hono, @extractus/feed-extractor, clsx）
- [x] `vite.config.ts` 作成
- [x] `tailwind.config.ts` 作成
- [x] `tsconfig.json` 作成（`strict: true`）
- [x] `tsconfig.worker.json` 作成
- [x] `wrangler.toml` 作成（Workers・D1・Cron・Pages 設定）
- [x] `.env.example` 作成
- [x] `.gitignore` 更新
- [x] `README.md` 作成

---

## 2. DB マイグレーション

- [x] `migrations/0001_initial.sql` 作成
  - `feeds` テーブル
  - `articles` テーブル（`UNIQUE(feed_id, guid)`）
  - `read_history` テーブル
  - インデックス（`idx_articles_feed_id`, `idx_articles_published_at`, `idx_read_history_article_id`）

---

## 3. 共通型定義

- [x] `src/types/index.ts` 作成
  - `Feed` 型
  - `Article` 型（`isRead`, `feedIsFavorite` を含む）
- [x] `worker/types/index.ts` 作成
  - `Env` インターフェース（`DB: D1Database`）

---

## 4. Worker — ライブラリ層

- [x] `worker/lib/db.ts` 作成
  - `getFeeds(db)`
  - `getFeedById(db, id)`
  - `insertFeed(db, feed)`
  - `updateFeed(db, id, patch)`
  - `deleteFeed(db, id)`
  - `getArticles(db, options)` （unread_only / limit / offset）
  - `insertArticle(db, article)`
  - `markAsRead(db, articleId)`
- [x] `worker/lib/rss.ts` 作成
  - `parseFeed(url)`: `@extractus/feed-extractor` ラッパー、Atom/RSS 両対応

---

## 5. Worker — ルート実装

- [x] `worker/routes/feeds.ts` 作成
  - `GET /api/feeds`
  - `POST /api/feeds`（URL fetch → タイトル取得 → INSERT）
  - `PATCH /api/feeds/:id`
  - `DELETE /api/feeds/:id`
- [x] `worker/routes/articles.ts` 作成
  - `GET /api/articles`
  - `POST /api/articles/:id/read`
- [x] `worker/cron/fetchFeeds.ts` 作成（Cron Trigger ハンドラ）
- [x] `worker/index.ts` 作成（Hono ルーティング + Cron scheduled ハンドラ）
- [x] `POST /api/cron/fetch` 開発用手動トリガーエンドポイント追加

---

## 6. フロントエンド — ライブラリ層

- [x] `src/lib/api.ts` 作成（Workers API クライアント関数群）
- [x] `src/lib/markdown.ts` 作成（`exportToMarkdown(articles)` 関数）

---

## 7. フロントエンド — カスタムフック

- [x] `src/hooks/useArticles.ts` 作成（TanStack Query: 記事取得・既読管理）
- [x] `src/hooks/useFeeds.ts` 作成（TanStack Query: フィード CRUD）
- [x] `src/hooks/useSelection.ts` 作成（`Set<string>` による選択状態管理）

---

## 8. フロントエンド — コンポーネント

- [x] `src/components/Toast.tsx` 作成
- [x] `src/components/CopyBar.tsx` 作成（選択件数表示・コピーボタン）
- [x] `src/components/ArticleCard.tsx` 作成（チェックボックス・既読スタイル）
- [x] `src/components/ArticleList.tsx` 作成（お気に入り/その他セクション）
- [x] `src/components/FeedForm.tsx` 作成
- [x] `src/components/FeedList.tsx` 作成（★トグル・削除確認）

---

## 9. フロントエンド — ページ

- [x] `src/pages/index.tsx` 作成（記事一覧画面・未読トグル）
- [x] `src/pages/feeds.tsx` 作成（フィード管理画面）
- [x] `src/App.tsx` 作成（ルーティング設定）
- [x] `src/main.tsx` 作成
- [x] `src/index.css` 作成（Tailwind ディレクティブ）

---

## 10. CI/CD

- [x] `.github/workflows/deploy.yml` 作成（`main` push 時に typecheck/lint/test/build/deploy）

---

## 11. テスト

- [x] `worker/lib/rss.test.ts` 作成（RSS パース単体テスト）
- [x] `src/lib/markdown.test.ts` 作成（Markdown 出力単体テスト）

---

## 完了基準

- `wrangler dev` でローカル動作確認
- 記事一覧・フィード管理・Markdown出力の全機能が動作
- `npm run typecheck` エラーなし
- `npm run lint` エラーなし
- `main` へのマージで自動デプロイ成功
