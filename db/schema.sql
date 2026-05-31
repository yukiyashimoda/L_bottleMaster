-- ============================================================
-- 統合スキーマ (Neon / PostgreSQL)
-- 3アプリ共通DB:  bottleMaster / shift / reservation
-- 名前空間をスキーマで分離。staff と customers は core に集約=単一の真実源。
-- 流し方:  psql $DATABASE_URL -f db/schema.sql  または Neon SQL Editor に貼り付け
-- ============================================================

CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS bottle;
CREATE SCHEMA IF NOT EXISTS shift;
CREATE SCHEMA IF NOT EXISTS reservation;

-- ============================================================
-- core : 3アプリ共有の核
-- ============================================================

-- キャスト（シフト送信者・指名対象） ------------------------
CREATE TABLE IF NOT EXISTS core.staff (
  id                      SERIAL PRIMARY KEY,
  name                    TEXT NOT NULL UNIQUE,        -- ステージ名（bottleMaster・shiftアプリ共通）
  display_name            TEXT,                        -- 本名（LINEプロフィールから取得）
  line_user_id            TEXT UNIQUE,                 -- LINE送信者の特定用
  role                    TEXT NOT NULL DEFAULT 'staff'
                            CHECK (role IN ('staff', 'admin')),
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  default_holidays        TEXT[] NOT NULL DEFAULT '{}', -- 毎週デフォルト休日（曜日インデックス配列）
  default_work_start_time TEXT,                        -- デフォルト出勤開始時刻
  default_work_end_time   TEXT,                        -- デフォルト出勤終了時刻
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_staff_line ON core.staff (line_user_id);

-- 顧客（ボトルキープ・予約） --------------------------------
CREATE TABLE IF NOT EXISTS core.customers (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,            -- 正式名   例: 佐藤恵一
  aliases      TEXT[] NOT NULL DEFAULT '{}',  -- 別名/表記ゆれ
  tags         TEXT[] NOT NULL DEFAULT '{}',  -- 呼び名タグ複数可 例: {"けーちゃん","6000様"}
  company      TEXT,
  appearance   TEXT,                     -- 見た目・特徴メモ
  location     TEXT,                     -- 顧客単位の保管場所
  line_user_id TEXT UNIQUE,              -- 予約LINE送信者の特定用（任意）
  note         TEXT,
  created_at   DATE,
  updated_at   DATE
);
CREATE INDEX IF NOT EXISTS idx_customers_aliases ON core.customers USING GIN (aliases);
CREATE INDEX IF NOT EXISTS idx_customers_name    ON core.customers (name);

-- ============================================================
-- bottle : ボトルマスター専用
-- ============================================================

CREATE TABLE IF NOT EXISTS bottle.bottles (
  id            SERIAL PRIMARY KEY,
  customer_id   INT NOT NULL REFERENCES core.customers(id) ON DELETE CASCADE,
  brand         TEXT NOT NULL,
  number        INT,
  remaining     NUMERIC(3,2),            -- 0.00〜1.00
  status        TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','finished')),
  bottle_tag    TEXT,
  location      TEXT,
  registered_at DATE
);
CREATE INDEX IF NOT EXISTS idx_bottles_customer ON bottle.bottles (customer_id);
CREATE INDEX IF NOT EXISTS idx_bottles_status   ON bottle.bottles (status);

-- 顧客 × キャスト（担当・指名 = 多対多） --------------------
CREATE TABLE IF NOT EXISTS bottle.customer_staff (
  customer_id  INT NOT NULL REFERENCES core.customers(id) ON DELETE CASCADE,
  staff_id     INT NOT NULL REFERENCES core.staff(id)     ON DELETE CASCADE,
  role         TEXT,                     -- 指名 / 元指名 / 場内
  is_current   BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (customer_id, staff_id, role)
);

-- 顧客同士の関係（同伴・ボトル共有） ------------------------
CREATE TABLE IF NOT EXISTS bottle.relationships (
  id           SERIAL PRIMARY KEY,
  customer_a   INT NOT NULL REFERENCES core.customers(id) ON DELETE CASCADE,
  customer_b   INT REFERENCES core.customers(id) ON DELETE CASCADE,
  partner_name TEXT,                     -- customer_b が NULL の時の相手名
  type         TEXT,                     -- 同伴 / ボトル共有
  note         TEXT
);
CREATE INDEX IF NOT EXISTS idx_rel_a ON bottle.relationships (customer_a);
CREATE INDEX IF NOT EXISTS idx_rel_b ON bottle.relationships (customer_b);

-- ============================================================
-- shift : シフト管理（キャストがLINEで送信）
-- ============================================================

CREATE TABLE IF NOT EXISTS shift.shifts (
  id            SERIAL PRIMARY KEY,
  staff_id      INT NOT NULL REFERENCES core.staff(id) ON DELETE CASCADE,
  work_date     DATE NOT NULL,
  start_at      TIME,
  end_at        TIME,
  status        TEXT NOT NULL DEFAULT 'undecided'
                 CHECK (status IN ('work', 'off', 'undecided')),
  shift_type    TEXT NOT NULL DEFAULT 'undecided'
                 CHECK (shift_type IN ('normal','nomination','customer_tel','accompanied','off','undecided')),
  note          TEXT NOT NULL DEFAULT '',   -- memo
  customer_name TEXT,                       -- 同伴・指名時のお客様名
  submit_status TEXT NOT NULL DEFAULT 'draft'
                 CHECK (submit_status IN ('draft', 'submitted')),
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved')),
  submitted_via TEXT,                       -- line / manual など（将来用）
  raw_message   TEXT,                       -- LINE原文（将来用）
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (staff_id, work_date)
);
CREATE INDEX IF NOT EXISTS idx_shifts_date   ON shift.shifts (work_date);
CREATE INDEX IF NOT EXISTS idx_shifts_staff  ON shift.shifts (staff_id);
CREATE INDEX IF NOT EXISTS idx_shifts_submit ON shift.shifts (submit_status);

-- ============================================================
-- reservation : 予約管理（将来実装）
-- ============================================================

CREATE TABLE IF NOT EXISTS reservation.reservations (
  id                 SERIAL PRIMARY KEY,
  customer_id        INT REFERENCES core.customers(id) ON DELETE SET NULL,
  customer_name_raw  TEXT,
  requested_staff_id INT REFERENCES core.staff(id) ON DELETE SET NULL,
  reserved_at        TIMESTAMPTZ NOT NULL,
  party_size         INT,
  table_no           TEXT,
  status             TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','confirmed','seated','done','canceled','no_show')),
  source             TEXT,
  raw_message        TEXT,
  note               TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resv_when     ON reservation.reservations (reserved_at);
CREATE INDEX IF NOT EXISTS idx_resv_customer ON reservation.reservations (customer_id);
CREATE INDEX IF NOT EXISTS idx_resv_staff    ON reservation.reservations (requested_staff_id);
CREATE INDEX IF NOT EXISTS idx_resv_status   ON reservation.reservations (status);

-- ============================================================
-- 既存DBへのマイグレーション用 ALTER TABLE（初回適用時は不要）
-- ============================================================
-- ALTER TABLE core.customers ALTER COLUMN tag DROP DEFAULT;
-- ALTER TABLE core.customers RENAME COLUMN tag TO tags;
-- ALTER TABLE core.customers ALTER COLUMN tags TYPE TEXT[] USING ARRAY[tags]::TEXT[];
-- ALTER TABLE core.customers ALTER COLUMN tags SET DEFAULT '{}';
-- ALTER TABLE core.customers ALTER COLUMN tags SET NOT NULL;

-- ALTER TABLE core.staff ADD COLUMN IF NOT EXISTS display_name TEXT;
-- ALTER TABLE core.staff ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff','admin'));
-- ALTER TABLE core.staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
-- ALTER TABLE core.staff ADD COLUMN IF NOT EXISTS default_holidays TEXT[] NOT NULL DEFAULT '{}';
-- ALTER TABLE core.staff ADD COLUMN IF NOT EXISTS default_work_start_time TEXT;
-- ALTER TABLE core.staff ADD COLUMN IF NOT EXISTS default_work_end_time TEXT;
-- ALTER TABLE core.staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
