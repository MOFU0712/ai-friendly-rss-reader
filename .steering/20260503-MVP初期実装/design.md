# 技術設計 — MVP初期実装

詳細: `docs/architecture.md` / `docs/functional-design.md` / `docs/repository-structure.md`

---

## テクノロジースタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | React 19 + TypeScript + Tailwind CSS + Vite |
| 状態管理 | TanStack Query（サーバー状態） |
| バックエンド | Cloudflare Workers + Hono |
| RSS パース | `@extractus/feed-extractor`（Web標準APIのみ、Workers対応） |
| DB | Cloudflare D1（SQLite互換） |
| マイグレーション | Wrangler CLI (`wrangler d1 migrations apply`) |
| Cron | Cloudflare Cron Triggers (`0 * * * *`) |
| CI/CD | GitHub Actions + Wrangler |

> **制約**: Cloudflare Workers は Node.js 非互換。`fs`・`path` 等は使用不可。

---

## データモデル

### `feeds`

| カラム | 型 | 説明 |
|--------|----|------|
| id | TEXT (UUID) | 主キー |
| url | TEXT | RSS フィード URL (UNIQUE) |
| title | TEXT | サイト名 |
| is_favorite | INTEGER | お気に入りフラグ (0/1) |
| fetch_order | INTEGER | 並び順 |
| created_at | TEXT | 登録日時 |
| last_fetched_at | TEXT | 最終取得日時 |

### `articles`

| カラム | 型 | 説明 |
|--------|----|------|
| id | TEXT (UUID) | 主キー |
| feed_id | TEXT | feeds.id への外部キー |
| guid | TEXT | 重複排除用識別子 |
| title | TEXT | 記事タイトル |
| url | TEXT | 記事 URL |
| summary | TEXT | 概要テキスト |
| author | TEXT | ライター名 |
| published_at | TEXT | 公開日時 |
| fetched_at | TEXT | DB 保存日時 |
| UNIQUE | (feed_id, guid) | 重複排除 |

### `read_history`

| カラム | 型 | 説明 |
|--------|----|------|
| id | TEXT (UUID) | 主キー |
| article_id | TEXT | articles.id への外部キー |
| read_at | TEXT | 既読日時 |

---

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/articles` | 記事一覧取得（`?unread_only=true&limit=50&offset=0`） |
| POST | `/api/articles/:id/read` | 記事を既読にする |
| GET | `/api/feeds` | フィード一覧取得 |
| POST | `/api/feeds` | フィード登録 |
| PATCH | `/api/feeds/:id` | フィード更新（お気に入り等） |
| DELETE | `/api/feeds/:id` | フィード削除 |
| POST | `/api/cron/fetch` | フィード手動更新（開発用） |

レスポンス形式: 成功 `{ data: T }` / エラー `{ error: string }`

---

## コンポーネント構成

```
src/
├── components/
│   ├── ArticleCard.tsx    # チェックボックス付き記事カード
│   ├── ArticleList.tsx    # お気に入り/その他セクション
│   ├── CopyBar.tsx        # 画面下部固定コピーバー
│   ├── FeedForm.tsx       # フィード登録フォーム
│   ├── FeedList.tsx       # フィード一覧（管理画面）
│   └── Toast.tsx          # トースト通知
├── hooks/
│   ├── useArticles.ts     # 記事取得・既読管理
│   ├── useFeeds.ts        # フィード管理
│   └── useSelection.ts   # 選択状態管理 (Set<string>)
├── pages/
│   ├── index.tsx          # 記事一覧画面
│   └── feeds.tsx          # フィード管理画面
└── lib/
    ├── api.ts             # Workers API クライアント
    └── markdown.ts        # Markdown 出力ヘルパー
```

```
worker/
├── index.ts              # Hono ルーティング
├── routes/
│   ├── articles.ts
│   └── feeds.ts
├── cron/
│   └── fetchFeeds.ts     # Cron 処理
└── lib/
    ├── db.ts              # D1 クエリヘルパー
    └── rss.ts             # feed-extractor ラッパー
```

---

## Cron 処理フロー

1. Cron Trigger 起動（毎時0分）
2. `feeds` テーブルから全フィード取得
3. 各フィードの RSS URL を fetch
4. `@extractus/feed-extractor` でパース
5. 各記事の `(feed_id, guid)` が DB に存在しなければ INSERT
6. `feeds.last_fetched_at` を更新
7. エラー発生フィードはスキップしてログ出力

---

## DB カラム名 ↔ TypeScript プロパティ変換

DB はスネークケース、TypeScript はキャメルケース。Worker のクエリ結果変換時に変換する。

```
is_favorite  →  isFavorite
published_at →  publishedAt
feed_id      →  feedId
```

---

## ローカル開発

```bash
# Workers + D1 ローカル起動
wrangler dev

# D1 マイグレーション（ローカル）
wrangler d1 migrations apply rss-reader-db --local

# フロントエンド開発サーバー
npm run dev
```
