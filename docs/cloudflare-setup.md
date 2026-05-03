# Cloudflare セットアップガイド

このドキュメントでは、本プロジェクトを Cloudflare 上で動かすために必要な初回設定手順を説明します。

---

## 前提条件

- [Cloudflare アカウント](https://dash.cloudflare.com/sign-up)（無料プランで OK）
- Node.js 20+
- npm

---

## 1. Wrangler CLI のセットアップ

### インストール

```bash
npm install
# wrangler は devDependencies に含まれているため上記で OK
# グローバルにも入れたい場合:
npm install -g wrangler
```

### Cloudflare アカウントにログイン

```bash
npx wrangler login
```

ブラウザが開くので、Cloudflare アカウントで認証します。成功すると以下が表示されます。

```
Successfully logged in.
```

### ログイン確認

```bash
npx wrangler whoami
```

アカウント名とメールアドレスが表示されれば OK です。

---

## 2. D1 データベースの作成

### データベースを作成する

```bash
npx wrangler d1 create rss-reader-db
```

実行すると以下のような出力が表示されます。

```
✅ Successfully created DB 'rss-reader-db'

[[d1_databases]]
binding = "DB"
database_name = "rss-reader-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← これをコピー
```

### wrangler.toml に database_id を設定

`wrangler.toml` の `database_id` を上記で表示された値に書き換えます。

```toml
[[d1_databases]]
binding = "DB"
database_name = "rss-reader-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← 実際の ID に置き換え
```

### マイグレーションを適用する

**ローカル開発用（.wrangler/state に保存）:**

```bash
npm run db:migrate:local
```

**本番 D1 への適用（初回デプロイ前に実施）:**

```bash
npm run db:migrate:remote
```

---

## 3. ローカル開発環境の起動

### Worker（API サーバー）を起動

```bash
npm run worker:dev
```

`http://localhost:8787` で Worker が起動します。

### フロントエンド開発サーバーを起動（別ターミナル）

```bash
npm run dev
```

`http://localhost:5173` で React アプリが起動します。
`/api/*` へのリクエストは自動的に `http://localhost:8787` にプロキシされます。

### 動作確認

ブラウザで `http://localhost:5173` を開き、フィードを追加してみてください。

---

## 4. 本番環境へのデプロイ（手動）

### フロントエンドをビルド

```bash
npm run build
```

`dist/` ディレクトリに静的ファイルが生成されます。

### Worker をデプロイ

```bash
npm run worker:deploy
```

デプロイ後、以下のような URL が表示されます。

```
https://rss-reader.<あなたのサブドメイン>.workers.dev
```

---

## 5. GitHub Actions による自動デプロイの設定

`main` ブランチへの push で自動デプロイするには、GitHub Secrets に API トークンを登録します。

### Cloudflare API トークンを発行

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログイン
2. 右上のアイコン → **「My Profile」** をクリック
3. 左メニュー **「API Tokens」** を選択
4. **「Create Token」** をクリック
5. **「Edit Cloudflare Workers」** テンプレートを選択
6. 以下の権限が含まれていることを確認:
   - `Account > Workers Scripts > Edit`
   - `Account > D1 > Edit`
   - `Zone > Workers Routes > Edit`（必要に応じて）
7. **「Continue to summary」→「Create Token」** をクリック
8. 表示されたトークンをコピー（**この画面を閉じると二度と表示されません**）

### GitHub Secrets に登録

1. GitHub リポジトリの **「Settings」→「Secrets and variables」→「Actions」** を開く
2. **「New repository secret」** をクリック
3. 以下を登録:

| Secret 名 | 値 |
|-----------|----|
| `CLOUDFLARE_API_TOKEN` | 上記で発行したトークン |

### 動作確認

`main` ブランチに push すると、GitHub Actions が以下の順で実行されます:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. D1 マイグレーション適用
6. Worker デプロイ

Actions タブで進捗を確認できます。

---

## 6. デプロイ後の確認

### Worker の動作確認

```bash
# フィード一覧取得
curl https://rss-reader.<サブドメイン>.workers.dev/api/feeds

# フィードの手動更新（開発用）
curl -X POST https://rss-reader.<サブドメイン>.workers.dev/api/cron/fetch
```

### Cron Trigger の確認

[Cloudflare ダッシュボード](https://dash.cloudflare.com/) → **Workers & Pages** → `rss-reader` → **「Triggers」タブ** で Cron が登録されていることを確認します。

`0 * * * *`（毎時0分）で設定されていれば OK です。

---

## 7. よくあるトラブルと対処法

### `database_id` が見つからない

```bash
# 作成済みの D1 データベース一覧を確認
npx wrangler d1 list
```

### マイグレーションが失敗する

```bash
# マイグレーション適用状況を確認
npx wrangler d1 migrations list rss-reader-db

# ローカルの D1 ファイルをリセットしたい場合
rm -rf .wrangler/state/v3/d1
npm run db:migrate:local
```

### `wrangler dev` でエラーが出る

```bash
# wrangler のバージョンを確認
npx wrangler --version

# Node.js のバージョンを確認（20 以上が必要）
node --version
```

### デプロイ後に API が 500 を返す

```bash
# Worker のログをリアルタイムで確認
npx wrangler tail
```

---

## 参考リンク

- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 ドキュメント](https://developers.cloudflare.com/d1/)
- [Wrangler CLI リファレンス](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
