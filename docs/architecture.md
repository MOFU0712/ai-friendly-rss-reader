# 技術仕様書

## テクノロジースタック

### フロントエンド

|項目     |技術                          |選定理由                             |
|-------|----------------------------|---------------------------------|
|フレームワーク|React 19                    |Cloudflare Pages との親和性、エコシステムの安定性|
|言語     |TypeScript                  |型安全性、フロント・バックエンド統一               |
|スタイリング |Tailwind CSS                |ユーティリティファーストで高速UI開発              |
|ビルドツール |Vite                        |高速ビルド、Cloudflare Pages対応         |
|状態管理   |React Query (TanStack Query)|サーバー状態管理、キャッシュ・再取得の簡略化           |

### バックエンド

|項目    |技術                         |選定理由                               |
|------|---------------------------|-----------------------------------|
|実行環境  |Cloudflare Workers         |エッジ実行、Cron Trigger対応、無料枠が十分        |
|言語    |TypeScript                 |フロントエンドと統一                         |
|RSSパース|`@extractus/feed-extractor`|Workers環境（Web標準API）で動作するRSSパーサー    |
|ルーティング|Hono                       |Workers向け軽量フレームワーク、TypeScript親和性が高い|


> **注意**: Cloudflare Workers は Node.js 互換ではなく Web 標準 API ベースのため、
> `rss-parser` など Node.js 依存のライブラリは動作しない。
> `@extractus/feed-extractor` はWeb標準APIのみで動作するため Workers で利用可能。

### データベース

|項目      |技術           |選定理由                                      |
|--------|-------------|------------------------------------------|
|DB      |Cloudflare D1|SQLite互換、Workers との直接バインディング、無料枠5GB       |
|マイグレーション|Wrangler CLI |D1公式ツール、`wrangler d1 migrations apply` で管理|

### インフラ

|項目    |技術                       |選定理由                              |
|------|-------------------------|----------------------------------|
|ホスティング|Cloudflare Pages         |フロントエンドのホスティング、Workers と同一プラットフォーム|
|Cron  |Cloudflare Cron Triggers |Workers に組み込み、無料枠で1時間間隔が可能        |
|CI/CD |GitHub Actions + Wrangler|push時に自動デプロイ                      |
|ドメイン  |pages.dev サブドメイン（無料）     |独自ドメインは将来対応                       |

-----

## 開発ツールと手法

|ツール              |用途                                          |
|-----------------|--------------------------------------------|
|Wrangler CLI     |Cloudflare Workers / D1 / Pages のデプロイ・ローカル開発|
|Claude Code      |AI駆動開発・コード生成                                |
|ESLint + Prettier|コード品質・フォーマット統一                              |
|Vitest           |ユニットテスト                                     |

### ローカル開発環境

```bash
# Workers + D1 をローカルで動かす
wrangler dev

# D1 マイグレーション（ローカル）
wrangler d1 migrations apply rss-reader-db --local

# フロントエンド開発サーバー
npm run dev
```

-----

## プロジェクト構成方針

Cloudflare Workers と Pages を**モノリポで管理**する。

```
/ (リポジトリルート)
├── src/              # フロントエンド (React)
├── worker/           # Cloudflare Workers (API + Cron)
├── migrations/       # D1 マイグレーションファイル
└── wrangler.toml     # Cloudflare 設定ファイル
```

`wrangler.toml` でフロントエンドのビルド出力を Pages として、
Worker を同一プロジェクト内に配置する構成（Pages Functions は使わず、独立した Worker を使用）。

-----

## 無料枠の制限と対策

|サービス         |無料枠       |本アプリでの想定使用量     |余裕  |
|-------------|----------|----------------|----|
|Workers リクエスト|10万回/日    |〜1,000回/日（個人利用） |✅ 十分|
|Workers CPU時間|10ms/リクエスト|Cron含め平均5ms以下   |✅ 十分|
|D1 読み取り      |2,500万回/日 |〜10,000回/日      |✅ 十分|
|D1 書き込み      |10万回/日    |〜1,000回/日（Cron時）|✅ 十分|
|D1 容量        |5GB       |数年分の記事でも数十MB程度  |✅ 十分|
|Cron Triggers|無制限       |1時間に1回          |✅ 十分|

-----

## 技術的制約と要件

### Cloudflare Workers の制約

- **Node.js APIは使用不可**：`fs`、`path`、Node.js固有モジュールは利用できない
- **実行時間上限**：無料プランは CPU 時間 10ms（ウォールタイムは30秒）。Cron時も同様
- **メモリ上限**：128MB
- **バンドルサイズ上限**：1MB（圧縮後）

### RSS パースの制約

- 一部のサイトはCORSを制限しているため、フロントから直接RSSを取得せずWorker経由で取得する
- 文字コードが `Shift_JIS` など非UTF-8のフィードは取得時に変換処理が必要な場合がある
- RSSとAtomの両形式に対応する（`@extractus/feed-extractor` が両対応）

-----

## パフォーマンス要件

|項目          |目標値             |
|------------|----------------|
|記事一覧の初期表示   |1秒以内            |
|フィード更新（Cron）|全フィード処理を30秒以内に完了|
|クリップボードコピー  |即時（ローカル処理）      |
|D1 クエリ応答    |100ms以内         |

-----

## 将来の拡張に向けた考慮

|拡張項目       |対応方針                                               |
|-----------|---------------------------------------------------|
|認証・マルチユーザー化|Cloudflare Access（ゼロトラスト）でアクセス制限、またはJWT認証をWorkerに追加|
|独自ドメイン     |Cloudflare DNS で設定（無料）                             |
|レコメンド機能    |D1にチェック履歴を蓄積しておく（`read_history` テーブルが活用できる）        |
|記事の全文取得    |Worker で対象URLをfetchしてパース（有料プランのCPU時間緩和が必要な可能性あり）   |