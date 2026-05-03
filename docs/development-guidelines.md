# 開発ガイドライン

## コーディング規約

### 基本方針

- **TypeScript の strict モードを有効にする**（`tsconfig.json` で `"strict": true`）
- `any` 型の使用は原則禁止。やむを得ない場合は `// eslint-disable-next-line` にコメントで理由を記載
- 関数の引数・戻り値には必ず型を付ける
- `null` より `undefined` を優先する（D1 の結果は `null` になるため、変換して統一する）

### 非同期処理

- `async/await` を使用し、コールバックや `.then()` チェーンは使わない
- Workers 内では必ず try-catch でエラーをハンドリングし、適切な HTTP ステータスコードを返す

```typescript
// Good
try {
  const result = await env.DB.prepare('SELECT * FROM feeds').all();
  return c.json(result.results);
} catch (error) {
  console.error('DB error:', error);
  return c.json({ error: 'Internal Server Error' }, 500);
}

// Bad
env.DB.prepare('SELECT * FROM feeds').all().then(result => { ... });
```

-----

## 命名規則

### 変数・関数

|種別          |規則                       |例                            |
|------------|-------------------------|-----------------------------|
|変数・関数       |camelCase                |`articleList`, `fetchFeeds()`|
|定数          |UPPER_SNAKE_CASE         |`MAX_ARTICLES_PER_FEED`      |
|型・インターフェース  |PascalCase               |`Article`, `FeedResponse`    |
|Reactコンポーネント|PascalCase               |`ArticleCard`, `CopyBar`     |
|カスタムフック     |`use` プレフィックス + camelCase|`useArticles`, `useSelection`|

### ファイル名

|種別          |規則                   |例                     |
|------------|---------------------|----------------------|
|Reactコンポーネント|PascalCase.tsx       |`ArticleCard.tsx`     |
|カスタムフック     |camelCase.ts         |`useArticles.ts`      |
|ユーティリティ     |camelCase.ts         |`markdown.ts`, `db.ts`|
|マイグレーション    |`NNNN_snake_case.sql`|`0001_initial.sql`    |

### DB カラム名とTypeScriptプロパティのマッピング

D1（SQLite）はスネークケース、TypeScript はキャメルケースで統一する。
Workers 側のクエリ結果変換時に変換を行う。

```typescript
// DB: is_favorite → TS: isFavorite
// DB: published_at → TS: publishedAt
// DB: feed_id → TS: feedId
```

-----

## スタイリング規約

- **Tailwind CSS のユーティリティクラスのみ使用する**
- カスタム CSS は原則書かない。どうしても必要な場合のみ `index.css` に追記
- コンポーネントのクラス名が長くなる場合は `clsx` または `cn` ヘルパーを使用する

```typescript
// Good
import { clsx } from 'clsx';

const cardClass = clsx(
  'rounded-lg border p-4',
  isRead && 'opacity-50',
  isSelected && 'border-blue-500 bg-blue-50'
);

// Bad - 条件分岐を文字列結合で書かない
const cardClass = `rounded-lg border p-4 ${isRead ? 'opacity-50' : ''} ${isSelected ? 'border-blue-500' : ''}`;
```

-----

## API 設計規約

### レスポンス形式

成功時・エラー時ともに JSON で返す。

```typescript
// 成功時
{ data: T }

// エラー時
{ error: string }
```

### HTTP ステータスコード

|状況        |ステータスコード|
|----------|--------|
|成功（取得）    |200     |
|成功（作成）    |201     |
|バリデーションエラー|400     |
|リソースが存在しない|404     |
|サーバーエラー   |500     |

-----

## テスト規約

- ユニットテストは **Vitest** を使用する
- テスト対象：`lib/` 配下のユーティリティ関数（RSSパース、Markdown生成など）
- Workers のルートハンドラは Hono のテストユーティリティ（`app.request()`）を使用する
- MVP 段階ではコンポーネントの E2E テストは対象外

```typescript
// テストファイルの配置例
worker/lib/rss.ts → worker/lib/rss.test.ts
src/lib/markdown.ts → src/lib/markdown.test.ts
```

-----

## Git 規約

### ブランチ戦略

- `main`：本番環境（Cloudflare Pages / Workers）に直結
- `feature/[機能名]`：機能追加
- `fix/[修正内容]`：バグ修正

```
feature/add-favorite-filter
fix/duplicate-article-display
```

### コミットメッセージ

**Conventional Commits** 形式を使用する。

```
feat: フィード登録フォームを追加
fix: 既読記事が再表示される問題を修正
chore: wrangler.toml の設定を更新
docs: README にセットアップ手順を追記
refactor: ArticleCard コンポーネントを分割
```

|プレフィックス   |用途      |
|----------|--------|
|`feat`    |新機能     |
|`fix`     |バグ修正    |
|`chore`   |ビルド・設定変更|
|`docs`    |ドキュメント  |
|`refactor`|リファクタリング|
|`test`    |テスト追加・修正|

### CI/CD

`main` ブランチへの push 時に GitHub Actions が自動で `wrangler deploy` を実行する。
**本番への反映は `main` へのマージのみ**で行う。

-----

## 環境変数・シークレット管理

- シークレット情報（APIキー等）は `.env` ファイルに記載し、`.gitignore` で除外する
- Workers のシークレットは `wrangler secret put` コマンドで登録する
- `.env.example` に必要な変数名のみ（値は空）を記載してリポジトリに含める

```bash
# .env.example
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```