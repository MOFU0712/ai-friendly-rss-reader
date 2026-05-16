# タスクリスト — RSSフィード自動検出

## ステータス凡例
- [ ] 未着手
- [~] 進行中
- [x] 完了

---

## 1. Worker — フィード検出ロジック

- [x] `worker/lib/feedDiscovery.ts` を作成
  - [x] `DiscoveredFeed` 型を定義 `{ url: string; title: string }`
  - [x] `discoverFeeds(siteUrl: string): Promise<DiscoveredFeed[]>` を実装
    - [x] ステップ①: `parseFeed(siteUrl)` で直接RSS判定
    - [x] ステップ②: `fetch(siteUrl)` → `HTMLRewriter` で `<link rel="alternate">` 抽出
      - [x] 相対URLを `new URL(href, siteUrl).href` で絶対URLに変換
      - [x] 抽出したURLに `parseFeed()` してタイトル取得
    - [x] ステップ③: 共通パス探索 (`/feed`, `/rss`, `/feed.xml`, `/atom.xml`, `/rss.xml`, `/index.xml`, `/feed/rss`)
    - [x] 各ステップは結果が得られたら短絡評価で打ち切る
    - [x] `AbortController` で 8 秒のタイムアウトを設定

---

## 2. Worker — ルート追加

- [x] `worker/routes/discover.ts` を作成
  - [x] `GET /` ハンドラ（`url` クエリパラメータを受け取り `discoverFeeds()` を呼ぶ）
  - [x] `url` 未指定時は 400 エラー
  - [x] レスポンス: `{ data: { feeds: DiscoveredFeed[] } }`
- [x] `worker/index.ts` を変更
  - [x] `discoverRouter` を `/api/feeds/discover` にマウント（`feedsRouter` より前に配置）

---

## 3. フロントエンド — API クライアント

- [x] `src/lib/api.ts` を変更
  - [x] `api.feeds.discover(url: string)` メソッドを追加
  - [x] レスポンス型: `{ feeds: { url: string; title: string }[] }`

---

## 4. フロントエンド — フック

- [x] `src/hooks/useFeeds.ts` を変更
  - [x] `useDiscoverFeed()` フックを追加 (`useMutation` ベース)

---

## 5. フロントエンド — FeedForm コンポーネント

- [x] `src/components/FeedForm.tsx` を変更
  - [x] `useDiscoverFeed()` を使用
  - [x] `candidates` state（候補リスト）を追加
  - [x] `debounceTimer` ref を追加
  - [x] `requestIdRef` で古いレスポンスの競合状態を防止
  - [x] URL入力フィールドの `onChange` に debounce（500ms）で検出処理を呼ぶロジックを追加
  - [x] 検出中はスピナー（"検索中..."）を表示
  - [x] 1件検出時: URLフィールドを自動上書き + 検出成功メッセージ
  - [x] 複数件検出時: 候補リストUIをフィールド下に表示
    - [x] 候補クリックでURLフィールドに反映し候補リストを閉じる
  - [x] 0件検出時: エラーメッセージを表示
  - [x] コンポーネントアンマウント時にdebounceタイマーをクリア

---

## 6. 動作確認

- [ ] サイトURL入力 → RSSフィード1件検出 → 自動入力 → 登録成功
- [ ] サイトURL入力 → 複数フィード検出 → 選択UI表示 → 選択 → 登録成功
- [ ] 存在しないサイトURL → 0件 → エラーメッセージ表示
- [ ] RSSフィードURL直接入力 → 検出ステップ①で成功 → そのまま登録できる
- [ ] 不正URL入力 → 検出がスキップされ通常のバリデーションエラー
- [ ] `npm run typecheck` エラーなし
- [ ] `npm run lint` エラーなし

---

## 完了基準

- フィード追加フォームにサイトURL（例: `https://zenn.dev`）を貼るとRSSフィードが自動検出される
- 直接RSSフィードURLを入力した場合も従来どおり動作する
- typecheck / lint エラーなし
- `main` へのマージで自動デプロイ成功
