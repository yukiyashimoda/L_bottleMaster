# 統合DB導入タスク (Claude Code向け指示書)

3アプリ共通のNeon(PostgreSQL)DBを構築する。**ORMは使わない。`@neondatabase/serverless` の生SQL運用。**
- **bottleMaster** (既存 `bottlelist`, Next.js 16 / React 19 / shadcn-ui): ボトルキープ顧客管理
- **shift**: キャストがLINEで送信したシフトを管理
- **reservation**: 顧客が自然言語でLINE送信 → 予約台帳化するチャットbot

`core.staff` と `core.customers` を共有の核とし、各アプリは外部キーで参照する(単一の真実源)。

## 構成ファイル
- `db/schema.sql` … 4スキーマ(core / bottle / shift / reservation)のDDL
- `db/seed.sample.json` … 顧客データ変換の「正解見本」5件
- `db/todo_source.txt` … 前任者todo原文(※要貼り付け)
- `src/lib/db.ts` … neonクライアント + 各取得/登録関数
- `src/lib/resolve.ts` … 予約botの名寄せ(名前→core.staff/core.customers の id)
- `src/types/*.ts` … bottle / shift / reservation の型

## やること

1. `db/schema.sql` を Neon に流す(4スキーマ・各テーブル作成)。
2. `db/todo_source.txt` の**全顧客**を `db/seed.sample.json` と同じ構造で `db/seed.json` に変換。
3. `db/seed.json` を読んで投入する `scripts/import.ts` を作成・実行:
   - キャストは `core.staff` に名寄せUNIQUE投入 → id解決して `bottle.customer_staff` に紐づけ
   - ボトルは `bottle.bottles`、関係は `bottle.relationships`
   - relationships の partnerName が `core.customers` に居れば customer_b を埋め、無ければ NULL+partner_name保持
4. bottleMaster の一覧/検索/詳細は `src/lib/db.ts` の getCustomerWithDetails / searchCustomers に倣う。
5. reservation bot: LINE Webhook → LLMで原文を `ParsedReservation` に構造化(A段) →
   `resolve.ts` の resolveStaff / resolveCustomerCandidates で id解決(B段) → `createReservation` で台帳化。
   - 顧客候補が0件=新規, 1件=確定, 複数=ユーザーに聞き返す。未確定でも raw_message を残して必ず登録。
6. shift app: LINE送信を日付・時刻にパース → `upsertShift`(同日再送信は上書き)。

## todo → JSON 変換ルール（seed.sample.json と厳密に一致させる）

- **日付**: 和暦 `R{N} M/D` → 西暦 `2018+N` 年。例 R8 1/31 → `2026-01-31`。`updatedAt` に入れる。
- **残量**: 「(残量0.6)」→ `remaining: 0.6`。記載なしは null。
- **飲みきり / 飲み切り**: そのボトルは `status:"finished"`、remaining は付けない。
- **銘柄と番号**: 「角サン84」→ brand:"角サン", number:84。「シーバスミズナラ18y」の 18y は年数なので分離しない。
- **タグ**: 「タグ:けーちゃん」は顧客 `tag`。ボトル単位(「きんみやタグ:まーくん」)は該当ボトルの `bottleTag`。
- **別名/表記ゆれ**: 「けーいち様 けいいち様」等は `aliases`。本名が判れば `name`。
- **担当キャスト**: 「指名」=role:"指名"・isCurrent:true、「元◯◯」=role:"元指名"・isCurrent:false、「場内」=role:"場内"。「みのり指名→まな指名へ」は まな=現指名 / みのり=元指名。
- **同伴・ボトル共有**: 「お連れ◯◯」「◯◯さんとボトル共有」は `relationships[]`(type: 同伴 / ボトル共有, partnerName に相手名)。
- **見た目メモ**: 「メガネかけた小柄なおじさん」等は `appearance`。
- **保管場所**: 「カウンター棚3」「調律棚置き」「棚5」。どのボトルか明記あれば bottle 側、不明なら customer 側。
- 判断に迷う断片は捨てずに `note` に残す。

## マイグレーション運用（重要）
3アプリが同じDBを触るので、**DDLの真実源は `db/schema.sql` 1本に集約**する。
各アプリは勝手にテーブルを作らず、必ずこのファイル経由で変更する。
スキーマ変更は連番マイグレーション(`db/migrations/0001_*.sql`)に分けて追記していくとなお安全。

## 検証
- `SELECT count(*) FROM core.customers;` が todo の顧客数と一致。
- 別名検索 `searchCustomers('けーいち')` で佐藤恵一がヒット。
- finished ボトルが status で除外でき、active のみ一覧表示できる。
- 予約: 名寄せ失敗時でも reservation.reservations に raw_message 付きで残る。

## 環境変数
`.env.local` に `DATABASE_URL=postgres://...@...neon.tech/...?sslmode=require`
3アプリで同じ DATABASE_URL を共有。厳密にやるならアプリごとにDBロールを分けて権限を絞る。
