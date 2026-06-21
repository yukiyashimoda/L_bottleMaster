import { neon } from '@neondatabase/serverless'
import { DEFAULT_STORE_ID, DEFAULT_STORE_NAME } from '@/lib/store-context'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  await sql`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT ''
    )
  `
  await sql`
    INSERT INTO stores (id, name, created_at)
    VALUES (${DEFAULT_STORE_ID}, ${DEFAULT_STORE_NAME}, ${new Date().toISOString()})
    ON CONFLICT (id) DO NOTHING
  `
  await sql`ALTER TABLE visit_records ADD COLUMN IF NOT EXISTS is_alert BOOLEAN NOT NULL DEFAULT false`
  await sql`ALTER TABLE visit_records ADD COLUMN IF NOT EXISTS alert_reason TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_glass BOOLEAN NOT NULL DEFAULT false`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS glass_memo TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS receipt_names TEXT[] NOT NULL DEFAULT '{}'`
  await sql`ALTER TABLE visit_records ADD COLUMN IF NOT EXISTS bottle_snapshots JSONB NOT NULL DEFAULT '[]'`
  await sql`ALTER TABLE bottles ADD COLUMN IF NOT EXISTS store_id TEXT NOT NULL DEFAULT 'store-main'`
  await sql`ALTER TABLE casts ADD COLUMN IF NOT EXISTS store_id TEXT NOT NULL DEFAULT 'store-main'`
  await sql`ALTER TABLE visit_records ADD COLUMN IF NOT EXISTS store_id TEXT NOT NULL DEFAULT 'store-main'`
  await sql`
    CREATE TABLE IF NOT EXISTS customer_store_profiles (
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      designated_cast_ids TEXT[] NOT NULL DEFAULT '{}',
      linked_customer_ids TEXT[] NOT NULL DEFAULT '{}',
      memo TEXT NOT NULL DEFAULT '',
      is_alert BOOLEAN NOT NULL DEFAULT false,
      alert_reason TEXT NOT NULL DEFAULT '',
      is_favorite BOOLEAN NOT NULL DEFAULT false,
      has_glass BOOLEAN NOT NULL DEFAULT false,
      glass_memo TEXT NOT NULL DEFAULT '',
      receipt_names TEXT[] NOT NULL DEFAULT '{}',
      last_visit_date TEXT,
      updated_at TEXT NOT NULL DEFAULT '',
      updated_by TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (customer_id, store_id)
    )
  `
  await sql`ALTER TABLE customer_store_profiles ADD COLUMN IF NOT EXISTS designated_cast_ids TEXT[] NOT NULL DEFAULT '{}'`
  await sql`ALTER TABLE customer_store_profiles ADD COLUMN IF NOT EXISTS linked_customer_ids TEXT[] NOT NULL DEFAULT '{}'`
  await sql`
    INSERT INTO customer_store_profiles (
      customer_id, store_id, designated_cast_ids, linked_customer_ids, memo, is_alert, alert_reason, is_favorite,
      has_glass, glass_memo, receipt_names, last_visit_date, updated_at, updated_by
    )
    SELECT
      id, ${DEFAULT_STORE_ID}, designated_cast_ids, linked_customer_ids, memo, is_alert, alert_reason,
      COALESCE(is_favorite, false), COALESCE(has_glass, false),
      COALESCE(glass_memo, ''), COALESCE(receipt_names, '{}'),
      last_visit_date, updated_at, updated_by
    FROM customers
    ON CONFLICT (customer_id, store_id) DO NOTHING
  `
  return Response.json({ ok: true, message: 'Migration complete' })
}
