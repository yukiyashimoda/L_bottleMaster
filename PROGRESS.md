# bottleList 作業進捗ログ

## 完了済み作業

### UI / ヘッダー修正
- **キャストフィルターアイコン**: 多色→単色に統一。未選択=アウトライン、選択中=塗りつぶし（`var(--text)`）
- **ホームヘッダー3行構成**: アプリアイコン行 → 検索バー行 → キャストフィルター行（`customer-view.tsx`）
- **全ページヘッダー `sticky top-0` に統一**: 旧 `top-14`/`top-16` を修正（顧客詳細・編集、キャスト詳細・編集、来店記録、新規顧客、お気に入り）
- **グローバルNavの浮きアイコン削除**: 全ページに被さっていた `position:fixed` のLアイコンを `nav.tsx` から除去
- **サイドバーシャドウ修正**: 閉じているとき右端に漏れていたシャドウを `sidebarOpen ? shadow : none` に変更
- **`var(--border)` CSS変数バグ修正**: `globals.css` でshadcnの `--border: 240 8% 90%`（HSL）が我々の `rgba(0,0,0,0.07)` を上書きしており、インラインスタイルのボーダーが全て非表示になっていた。全ファイルで `var(--border)` → `hsl(var(--border))` に変更
- **顧客カードアバター修正**: `designatedCastRuby?.charAt(0)` → `designatedCastRuby`（フルネーム表示）、`'?'` → `'FREE'`

### データ構造変更
- **`tag TEXT` → `tags TEXT[]`**: `core.customers` テーブル、TypeScript型、import/parse APIルートをすべて配列対応に変更
  - `schema.sql`: `tags TEXT[] NOT NULL DEFAULT '{}'`
  - `src/app/api/dev/parse/route.ts`: AIプロンプトを `tags: []` に
  - `src/app/api/dev/import/route.ts`: `CustomerInput.tags?: string[] | null`
  - `src/app/dev/import/page.tsx`: 複数タグ表示対応
  - Neon DB マイグレーション実行済み（`tag` → `tags` RENAME + TYPE変更）

### データ登録
- **キャスト「あいか」** を `public.casts` に登録（id: `1780291633110-wi8fpq1`）
- **顧客「ヒロシ」** 登録（ruby: ひろし、nickname: 6000様、tags: [ケンタ, 6000様]、指名: あいか）
  - ボトル: いいちこ陶器(0.7/カウンター棚D)、角サン(0.8)、吉四六86、ローヤル31、いいちこSP(飲みきり)
- **顧客「細越恭介」** 登録（ruby: ほそこし、指名: あいか）
  - ボトル: 鍛高譚梅酒 no.36（残量0.4）

### 環境・設定
- **`cc-company` プラグイン**: `.claude/settings.json` に追加（`company@cc-company`）
- **tsx インストール**: `npm install -D tsx`（seed/insertスクリプト実行用）
- **ハイドレーションエラー修正**: `.next` キャッシュクリア → 再起動

---

## 現在のDB構成

| テーブル | 用途 | 備考 |
|---------|------|------|
| `public.customers` | **アプリが実際に読み書きする顧客テーブル** | kv.ts が参照 |
| `public.bottles` | **アプリが実際に読み書きするボトルテーブル** | kv.ts が参照 |
| `public.casts` | **アプリが実際に読み書きするキャストテーブル** | kv.ts が参照 |
| `public.visit_records` | 来店記録 | kv.ts が参照 |
| `core.customers` | 統合DB用（将来移行先） | seed.ts / insert-aika.ts で操作 |
| `bottle.bottles` | 統合DB用（将来移行先） | seed.ts / insert-aika.ts で操作 |
| `core.staff` | 統合DB用（将来移行先） | seed.ts が操作 |

> ⚠️ **重要**: アプリは `public.*` を読んでいる。`core.*` / `bottle.*` は将来の統合DB用で現在は未使用。データ追加は `public.*` テーブルに行う。

---

## 未着手・次のタスク（CLAUDE.md より）

1. `db/todo_source.txt` の全顧客を `db/seed.json` に変換（あいか担当分は上記で追加済み）
2. `scripts/import.ts` 作成・実行（統合DBへの一括投入）
3. bottleMaster の検索/詳細を `src/lib/db.ts` の新関数に移行
4. reservation bot（LINE Webhook → LLM → 予約台帳）
5. shift app（LINE送信 → シフト管理）

---

## 変換済みキャスト担当データ

### あいか担当
- ヒロシ（登録済み ✅）
- 細越恭介（登録済み ✅）

---

## 主要ファイル

| ファイル | 内容 |
|---------|------|
| `src/components/customer-view.tsx` | ホームページ（検索・キャストフィルター・顧客リスト） |
| `src/components/customer-card.tsx` | 顧客カード（アバター=キャストruby or FREE） |
| `src/components/nav.tsx` | 下部ナビ＋サイドバー（Navのfixedアイコンは削除済み） |
| `src/lib/kv.ts` | DB読み書き（`public.*` テーブル参照） |
| `db/seed.ts` | 統合DB用シードスクリプト |
| `db/insert-aika.ts` | あいか担当顧客の `public.*` への投入スクリプト |
| `db/schema.sql` | 統合DBスキーマ（DDL） |
| `.claude/settings.json` | プロジェクト用Claude Code設定（cc-company有効） |
