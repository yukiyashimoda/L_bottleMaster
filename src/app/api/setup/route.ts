import { neon } from '@neondatabase/serverless'
import { mockCustomers, mockBottles, mockCasts, mockVisitRecords } from '@/lib/mock-data'
import { DEFAULT_STORE_ID, DEFAULT_STORE_NAME } from '@/lib/store-context'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)

  // Create tables
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
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ruby TEXT NOT NULL,
      nickname TEXT NOT NULL DEFAULT '',
      designated_cast_ids TEXT[] NOT NULL DEFAULT '{}',
      is_alert BOOLEAN NOT NULL DEFAULT false,
      alert_reason TEXT NOT NULL DEFAULT '',
      memo TEXT NOT NULL DEFAULT '',
      linked_customer_ids TEXT[] NOT NULL DEFAULT '{}',
      last_visit_date TEXT,
      updated_at TEXT NOT NULL DEFAULT '',
      updated_by TEXT NOT NULL DEFAULT ''
    )
  `
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_glass BOOLEAN NOT NULL DEFAULT false`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS glass_memo TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS receipt_names TEXT[] NOT NULL DEFAULT '{}'`
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
    CREATE TABLE IF NOT EXISTS bottles (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL DEFAULT 'store-main',
      customer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      remaining TEXT NOT NULL,
      opened_date TEXT NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS casts (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL DEFAULT 'store-main',
      name TEXT NOT NULL,
      ruby TEXT NOT NULL,
      memo TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT '',
      updated_by TEXT NOT NULL DEFAULT ''
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS visit_records (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL DEFAULT 'store-main',
      customer_id TEXT NOT NULL,
      visit_date TEXT NOT NULL,
      designated_cast_ids TEXT[] NOT NULL DEFAULT '{}',
      in_store_cast_ids TEXT[] NOT NULL DEFAULT '{}',
      bottles_opened TEXT[] NOT NULL DEFAULT '{}',
      bottles_used TEXT[] NOT NULL DEFAULT '{}',
      memo TEXT NOT NULL DEFAULT ''
    )
  `
  await sql`ALTER TABLE bottles ADD COLUMN IF NOT EXISTS store_id TEXT NOT NULL DEFAULT 'store-main'`
  await sql`ALTER TABLE casts ADD COLUMN IF NOT EXISTS store_id TEXT NOT NULL DEFAULT 'store-main'`
  await sql`ALTER TABLE visit_records ADD COLUMN IF NOT EXISTS store_id TEXT NOT NULL DEFAULT 'store-main'`
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

  // Seed only if tables are empty
  const existing = await sql`SELECT COUNT(*) as count FROM customers`
  if (Number(existing[0].count) > 0) {
    return Response.json({ ok: true, message: 'Already seeded' })
  }

  for (const c of mockCustomers) {
    await sql`
      INSERT INTO customers (id, name, ruby, nickname, designated_cast_ids, is_alert, alert_reason, memo, linked_customer_ids, last_visit_date, updated_at, updated_by)
      VALUES (${c.id}, ${c.name}, ${c.ruby}, ${c.nickname}, ${c.designatedCastIds}, ${c.isAlert}, ${c.alertReason}, ${c.memo}, ${c.linkedCustomerIds}, ${c.lastVisitDate}, ${c.updatedAt}, ${c.updatedBy})
      ON CONFLICT (id) DO NOTHING
    `
    await sql`
      INSERT INTO customer_store_profiles (
        customer_id, store_id, designated_cast_ids, linked_customer_ids, memo, is_alert, alert_reason, is_favorite,
        has_glass, glass_memo, receipt_names, last_visit_date, updated_at, updated_by
      )
      VALUES (
        ${c.id}, ${DEFAULT_STORE_ID}, ${c.designatedCastIds}, ${c.linkedCustomerIds}, ${c.memo}, ${c.isAlert}, ${c.alertReason},
        ${c.isFavorite ?? false}, ${c.hasGlass ?? false}, ${c.glassMemo ?? ''},
        ${c.receiptNames ?? []}, ${c.lastVisitDate}, ${c.updatedAt}, ${c.updatedBy}
      )
      ON CONFLICT (customer_id, store_id) DO NOTHING
    `
  }
  for (const b of mockBottles) {
    await sql`
      INSERT INTO bottles (id, store_id, customer_id, name, remaining, opened_date)
      VALUES (${b.id}, ${DEFAULT_STORE_ID}, ${b.customerId}, ${b.name}, ${b.remaining}, ${b.openedDate})
      ON CONFLICT (id) DO NOTHING
    `
  }
  for (const c of mockCasts) {
    await sql`
      INSERT INTO casts (id, store_id, name, ruby, memo, updated_at, updated_by)
      VALUES (${c.id}, ${DEFAULT_STORE_ID}, ${c.name}, ${c.ruby}, ${c.memo}, ${c.updatedAt}, ${c.updatedBy})
      ON CONFLICT (id) DO NOTHING
    `
  }
  for (const v of mockVisitRecords) {
    await sql`
      INSERT INTO visit_records (id, store_id, customer_id, visit_date, designated_cast_ids, in_store_cast_ids, bottles_opened, bottles_used, memo)
      VALUES (${v.id}, ${DEFAULT_STORE_ID}, ${v.customerId}, ${v.visitDate}, ${v.designatedCastIds}, ${v.inStoreCastIds}, ${v.bottlesOpened}, ${v.bottlesUsed}, ${v.memo})
      ON CONFLICT (id) DO NOTHING
    `
  }

  return Response.json({ ok: true, message: 'Setup complete' })
}
