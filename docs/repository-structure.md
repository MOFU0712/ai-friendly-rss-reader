# リポジトリ構造定義書

## ディレクトリ構成

```
rss-reader/
│
├── src/                          # フロントエンド (React)
│   ├── components/
│   │   ├── ArticleCard.tsx       # 記事カード（チェックボックス含む）
│   │   ├── ArticleList.tsx       # 記事一覧（セクション分け）
│   │   ├── CopyBar.tsx           # 選択記事のコピーバー（画面下部固定）
│   │   ├── FeedForm.tsx          # フィード登録フォーム
│   │   ├── FeedList.tsx          # フィード一覧（管理画面）
│   │   └── Toast.tsx             # トースト通知
│   ├── hooks/
│   │   ├── useArticles.ts        # 記事取得・既読管理
│   │   ├── useFeeds.ts           # フィード管理
│   │   └── useSelection.ts      # 記事選択状態管理
│   ├── pages/
│   │   ├── index.tsx             # 記事一覧画面
│   │   └── feeds.tsx             # フィード管理画面
│   ├── lib/
│   │   ├── api.ts                # Workers API クライアント
│   │   └── markdown.ts          # Markdown出力ヘルパー
│   ├── types/
│   │   └── index.ts             # 共通型定義（Article, Feed 等）
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── worker/                       # Cloudflare Workers (API + Cron)
│   ├── index.ts                  # エントリーポイント・ルーティング (Hono)
│   ├── routes/
│   │   ├── articles.ts           # /api/articles 関連ハンドラ
│   │   └── feeds.ts             # /api/feeds 関連ハンドラ
│   ├── cron/
│   │   └── fetchFeeds.ts        # Cron Trigger: フィード取得・保存処理
│   ├── lib/
│   │   ├── db.ts                # D1 クエリヘルパー
│   │   └── rss.ts               # RSSパース処理（feed-extractor wrapper）
│   └── types/
│       └── index.ts             # Worker 側型定義・Env インターフェース
│
├── migrations/                   # D1 マイグレーションファイル
│   └── 0001_initial.sql         # 初期テーブル定義
│
├── docs/                         # 永続的ドキュメント
│   ├── product-requirements.md
│   ├── functional-design.md
│   ├── architecture.md
│   ├── repository-structure.md
│   ├── development-guidelines.md
│   └── glossary.md
│
├── .steering/                    # 作業単位のドキュメント
│   └── YYYYMMDD-[タイトル]/
│       ├── requirements.md
│       ├── design.md
│       └── tasklist.md
│
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions: Wrangler デプロイ
│
├── public/                       # 静的アセット
│   └── favicon.ico
│
├── wrangler.toml                 # Cloudflare 設定（Workers・D1・Cron・Pages）
├── vite.config.ts               # Vite 設定
├── tailwind.config.ts           # Tailwind CSS 設定
├── tsconfig.json                # TypeScript 設定（フロントエンド）
├── tsconfig.worker.json         # TypeScript 設定（Workers）
├── package.json
├── .env.example                 # 環境変数サンプル
├── .gitignore
└── README.md
```

-----

## 主要ファイルの役割

### `wrangler.toml`

Cloudflare のすべての設定を管理するファイル。

```toml
name = "rss-reader"
main = "worker/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "rss-reader-db"
database_id = "<D1のID>"

[triggers]
crons = ["0 * * * *"]   # 毎時0分に実行

[site]
bucket = "./dist"        # Viteビルド出力先
```

### `worker/types/index.ts`

Workers 環境変数の型定義。D1 バインディングをここで宣言する。

```typescript
export interface Env {
  DB: D1Database;
}
```

### `src/types/index.ts`

フロントエンドとWorker間で共有する型定義。

```typescript
export type Feed = {
  id: string;
  url: string;
  title: string;
  isFavorite: boolean;
  fetchOrder: number;
  lastFetchedAt: string | null;
};

export type Article = {
  id: string;
  feedId: string;
  feedTitle: string;
  guid: string;
  title: string;
  url: string;
  summary: string | null;
  author: string | null;
  publishedAt: string;
  isRead: boolean;
};
```

### `migrations/0001_initial.sql`

D1 の初期テーブル定義。

```sql
CREATE TABLE IF NOT EXISTS feeds (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  fetch_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  last_fetched_at TEXT
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  feed_id TEXT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  guid TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  summary TEXT,
  author TEXT,
  published_at TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  UNIQUE(feed_id, guid)
);

CREATE TABLE IF NOT EXISTS read_history (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  read_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles(feed_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_read_history_article_id ON read_history(article_id);
```

-----

## ファイル配置ルール

- **フロントエンドとWorkerのコードは `src/` と `worker/` で明確に分離する**
- `src/types/` と `worker/types/` の共通型は `src/types/index.ts` に定義し、Worker側からもインポートする
- コンポーネントは機能単位で1ファイル1コンポーネントとする
- Workerのビジネスロジックは `routes/` や `cron/` に分離し、`index.ts` はルーティングのみとする
- マイグレーションファイルは連番プレフィックス（`0001_`, `0002_`）で管理する