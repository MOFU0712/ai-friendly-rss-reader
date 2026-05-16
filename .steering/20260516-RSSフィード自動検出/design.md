# 技術設計 — RSSフィード自動検出

---

## 全体フロー

```
ユーザーがURLを入力
    │ 500ms debounce
    ▼
フロントエンド: POST /api/feeds/discover
    │
    ▼
Worker: feedDiscovery.ts
    ├─① 入力URLをRSSとして直接パース試行
    │     成功 → [{ url, title }] を返す
    ├─② HTML取得 → HTMLRewriter で <link rel="alternate"> を抽出
    │     成功 → 見つかったfeed URL一覧を返す
    └─③ 共通パス(/feed, /rss, ...) を順に fetch → HEAD or GET → RSS判定
          成功 → [{ url, title }] を返す
    いずれも失敗 → 空配列 [] を返す
    │
    ▼
フロントエンド:
    0件 → エラー表示
    1件 → URL自動入力
    複数件 → 候補選択UI表示
```

---

## API

### 新規エンドポイント

```
GET /api/feeds/discover?url=<site_url>
```

**クエリパラメータ**

| パラメータ | 型 | 説明 |
|------------|-----|------|
| url | string | 検出対象のURL（エンコード済み） |

**レスポンス（成功）**

```json
{
  "data": {
    "feeds": [
      { "url": "https://example.com/feed.xml", "title": "Example Blog" },
      { "url": "https://example.com/rss", "title": "Example Blog RSS" }
    ]
  }
}
```

**レスポンス（エラー）**

```json
{ "error": "url is required" }
```

`feeds` が空配列の場合は `200` を返す（検出できなかった正常ケース）。

---

## Worker 実装

### 新規ファイル: `worker/lib/feedDiscovery.ts`

```typescript
export type DiscoveredFeed = { url: string; title: string };

export async function discoverFeeds(siteUrl: string): Promise<DiscoveredFeed[]>
```

内部処理:

1. **直接RSS判定**  
   `parseFeed(siteUrl)` を呼ぶ。成功したら `[{ url: siteUrl, title }]` を返す。

2. **HTMLの `<link>` タグ解析**  
   `fetch(siteUrl)` でHTMLを取得。  
   Cloudflare Workers の `HTMLRewriter` を使って `<link>` 要素を走査し、  
   `rel="alternate"` かつ `type` が `application/rss+xml` または `application/atom+xml`  
   のものを収集する。  
   `href` が相対URLの場合は `new URL(href, siteUrl).href` で絶対URLに変換。  
   見つかった各URLに対して `parseFeed()` を呼びタイトルを取得して返す。

3. **共通パス探索**  
   以下のパスを順に試し、`parseFeed()` が成功したものを返す（最初の1件で打ち切り）。  
   候補: `['/feed', '/rss', '/feed.xml', '/atom.xml', '/rss.xml', '/index.xml', '/feed/rss']`  
   ベースURLは `new URL(siteUrl).origin` を使用。

各ステップで結果が得られたら後続ステップをスキップする（短絡評価）。

### 新規ファイル: `worker/routes/discover.ts`

```typescript
import { Hono } from 'hono';
import type { Env } from '../types';
import { discoverFeeds } from '../lib/feedDiscovery';

export const discoverRouter = new Hono<{ Bindings: Env }>();

discoverRouter.get('/', async (c) => {
  const url = c.req.query('url');
  if (!url) return c.json({ error: 'url is required' }, 400);

  try {
    const feeds = await discoverFeeds(url);
    return c.json({ data: { feeds } });
  } catch {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});
```

### 変更ファイル: `worker/index.ts`

`discoverRouter` を `/api/feeds/discover` にマウントする。  
既存の `feedsRouter` の前に配置（パスの競合回避）。

```typescript
app.route('/api/feeds/discover', discoverRouter);
app.route('/api/feeds', feedsRouter);
```

---

## フロントエンド実装

### 変更ファイル: `src/lib/api.ts`

`api.feeds` に `discover` メソッドを追加する。

```typescript
discover: async (url: string): Promise<{ feeds: { url: string; title: string }[] }> => {
  const res = await fetch(`/api/feeds/discover?url=${encodeURIComponent(url)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Discovery failed');
  return json.data;
}
```

### 変更ファイル: `src/hooks/useFeeds.ts`

`useDiscoverFeed` フックを追加する。

```typescript
export function useDiscoverFeed() {
  return useMutation({
    mutationFn: (url: string) => api.feeds.discover(url),
  });
}
```

### 変更ファイル: `src/components/FeedForm.tsx`

**状態追加**

```typescript
// 検出候補リスト（複数件時に表示）
const [candidates, setCandidates] = useState<{ url: string; title: string }[]>([]);
const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
```

**UIフロー**

```
[URLフィールド] [追加ボタン]
  │
  ├─ 入力中: debounce 500ms 後に自動検出
  │
  ├─ 検出中: URLフィールド右側にスピナー表示
  │
  ├─ 1件検出: URLフィールドを自動上書き + "RSSフィードを検出しました" メッセージ
  │
  ├─ 複数件検出: フィールド下に候補リスト表示
  │     └─ 各候補をクリック → URLフィールドに反映 → 候補リスト非表示
  │
  └─ 0件: "RSSフィードが見つかりませんでした" エラー表示
```

**既存動作との互換性**  
- RSSフィードのURLを直接入力した場合: 検出ステップ①で直接パースに成功するため、URLが変わらずそのまま登録できる
- 手動でURLを書き換えた場合: 再度debounceが走り再検出する

---

## 変更ファイル一覧

| ファイル | 変更種別 |
|----------|----------|
| `worker/lib/feedDiscovery.ts` | 新規作成 |
| `worker/routes/discover.ts` | 新規作成 |
| `worker/index.ts` | 変更（ルート追加） |
| `src/lib/api.ts` | 変更（`discover` メソッド追加） |
| `src/hooks/useFeeds.ts` | 変更（`useDiscoverFeed` 追加） |
| `src/components/FeedForm.tsx` | 変更（自動検出UI実装） |

---

## エラーハンドリング方針

| ケース | 対応 |
|--------|------|
| 入力URLが不正（パース不可） | `new URL()` で事前チェック、検出をスキップ |
| fetchタイムアウト | `AbortController` で 8 秒でキャンセル |
| 対象サイトがCORSブロック | Workerサイドで行うためブラウザCORSは無関係 |
| パースエラー（RSSでない） | 例外キャッチして次のステップへ |
| Worker内部エラー | 500を返す、フロントはエラーメッセージ表示 |
