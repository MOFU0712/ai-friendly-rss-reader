# AI-Friendly RSS Reader

RSSフィードを快適に消費し、気になった記事をMarkdown形式でAIに渡せる軽量Webアプリケーション。

## 機能

- RSS/Atomフィードの登録・管理
- 記事一覧のカード形式表示（お気に入り優先・未読管理）
- 複数記事を選択してMarkdown形式でクリップボードにコピー
- Cron Triggerで1時間ごとの自動フィード更新

## テクノロジースタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React 19 + TypeScript + Tailwind CSS + Vite |
| バックエンド | Cloudflare Workers + Hono |
| DB | Cloudflare D1 (SQLite互換) |
| ホスティング | Cloudflare Pages |

## セットアップ

### 前提条件

- Node.js 20+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare アカウント

### インストール

```bash
npm install
```

### D1 データベースの作成

```bash
# D1 データベースを作成
wrangler d1 create rss-reader-db
# 表示された database_id を wrangler.toml に記入

# バインディング設定後、マイグレーションを適用
npm run db:migrate:local
```

### ローカル開発

```bash
# Worker + D1 をローカル起動（ポート 8787）
npm run worker:dev

# 別ターミナルでフロントエンドを起動（/api は Worker にプロキシ）
npm run dev
```

### 現在のコードを検証

```bash
npm run typecheck
npm run lint
npm test
```

## デプロイ

`main` ブランチへの push で GitHub Actions が自動デプロイを実行します。

GitHub Secrets に以下を設定してください:
- `CLOUDFLARE_API_TOKEN`

## ドキュメント

- [docs/product-requirements.md](docs/product-requirements.md) — プロダクト要求定義書
- [docs/architecture.md](docs/architecture.md) — 技術仕様書
- [docs/functional-design.md](docs/functional-design.md) — 機能設計書
- [docs/development-guidelines.md](docs/development-guidelines.md) — 開発ガイドライン
