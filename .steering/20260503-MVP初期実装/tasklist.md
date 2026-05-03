# タスクリスト — MVP初期実装

## ステータス凡例
- [ ] 未着手
- [x] 完了

---

## 1. プロジェクト初期設定

- [ ] `package.json` 作成（React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Hono, @extractus/feed-extractor, clsx）
- [ ] `vite.config.ts` 作成
- [ ] `tailwind.config.ts` 作成
- [ ] `tsconfig.json` 作成（`strict: true`）
- [ ] `tsconfig.worker.json` 作成
- [ ] `wrangler.toml` 作成（Workers・D1・Cron・Pages 設定）
- [ ] `.env.example` 作成
- [ ] `.gitignore` 更新
- [ ] `README.md` 作成

---

## 2. DB マイグレーション

- [ ] `migrations/0001_initial.sql` 作成
  - `feeds` テーブル
  - `articles` テーブル（`UNIQUE(feed_id, guid)`）
  - `read_history` テーブル
  - インデックス（`idx_articles_feed_id`, `idx_articles_published_at`, `idx_read_history_article_id`）

---

## 3. 共通型定義

- [ ] `src/types/index.ts` 作成
  - `Feed` 型
  - `Article` 型（`isRead` を派生プロパティとして含む）
- [ ] `worker/types/index.ts` 作成
  - `Env` インターフェース（`DB: D1Database`）

---

## 4. Worker — ライブラリ層

- [ ] `worker/lib/db.ts` 作成
  - `getFeeds(db)`
  - `getFeedById(db, id)`
  - `insertFeed(db, feed)`
  - `updateFeed(db, id, patch)`
  - `deleteFeed(db, id)`
  - `getArticles(db, options)` （unread_only / limit / offset）
  - `insertArticle(db, article)`
  - `markAsRead(db, articleId)`
- [ ] `worker/lib/rss.ts` 作成
  - `parseFeed(url)`: `@extractus/feed-extractor` ラッパー、Atom/RSS 両対応

---

## 5. Worker — ルート実装

- [ ] `worker/routes/feeds.ts` 作成
  - `GET /api/feeds`
  - `POST /api/feeds`（URL fetch → タイトル取得 → INSERT）
  - `PATCH /api/feeds/:id`
  - `DELETE /api/feeds/:id`
- [ ] `worker/routes/articles.ts` 作成
  - `GET /api/articles`
  - `POST /api/articles/:id/read`
- [ ] `worker/cron/fetchFeeds.ts` 作成（Cron Trigger ハンドラ）
- [ ] `worker/index.ts` 作成（Hono ルーティング + Cron scheduled ハンドラ）
- [ ] `POST /api/cron/fetch` 開発用手動トリガーエンドポイント追加

---

## 6. フロントエンド — ライブラリ層

- [ ] `src/lib/api.ts` 作成（Workers API クライアント関数群）
- [ ] `src/lib/markdown.ts` 作成（`exportToMarkdown(articles)` 関数）

---

## 7. フロントエンド — カスタムフック

- [ ] `src/hooks/useArticles.ts` 作成（TanStack Query: 記事取得・既読管理）
- [ ] `src/hooks/useFeeds.ts` 作成（TanStack Query: フィード CRUD）
- [ ] `src/hooks/useSelection.ts` 作成（`Set<string>` による選択状態管理）

---

## 8. フロントエンド — コンポーネント

- [ ] `src/components/Toast.tsx` 作成
- [ ] `src/components/CopyBar.tsx` 作成（選択件数表示・コピーボタン）
- [ ] `src/components/ArticleCard.tsx` 作成（チェックボックス・既読スタイル）
- [ ] `src/components/ArticleList.tsx` 作成（お気に入り/その他セクション）
- [ ] `src/components/FeedForm.tsx` 作成
- [ ] `src/components/FeedList.tsx` 作成（★トグル・削除確認）

---

## 9. フロントエンド — ページ

- [ ] `src/pages/index.tsx` 作成（記事一覧画面・未読トグル）
- [ ] `src/pages/feeds.tsx` 作成（フィード管理画面）
- [ ] `src/App.tsx` 作成（ルーティング設定）
- [ ] `src/main.tsx` 作成
- [ ] `src/index.css` 作成（Tailwind ディレクティブ）

---

## 10. CI/CD

- [ ] `.github/workflows/deploy.yml` 作成（`main` push 時に `wrangler deploy`）

---

## 11. テスト

- [ ] `worker/lib/rss.test.ts` 作成（RSS パース単体テスト）
- [ ] `src/lib/markdown.test.ts` 作成（Markdown 出力単体テスト）

---

## 完了基準

- `wrangler dev` でローカル動作確認
- 記事一覧・フィード管理・Markdown出力の全機能が動作
- `npm run typecheck` エラーなし
- `npm run lint` エラーなし
- `main` へのマージで自動デプロイ成功
