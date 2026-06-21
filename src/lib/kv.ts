import { neon } from '@neondatabase/serverless'
import type { Customer, Bottle, Cast, VisitRecord } from '@/types'
import { getCurrentStoreId } from './store-context'
import {
  mockCustomers,
  mockBottles,
  mockCasts,
  mockVisitRecords,
} from './mock-data'

// In-memory fallback for local dev without DATABASE_URL
const useDB = !!process.env.DATABASE_URL

function getSQL() {
  return neon(process.env.DATABASE_URL!)
}

const store = {
  customers: new Map<string, Customer>(mockCustomers.map((c) => [c.id, c])),
  bottles: new Map<string, Bottle>(mockBottles.map((b) => [b.id, b])),
  casts: new Map<string, Cast>(mockCasts.map((c) => [c.id, c])),
  visitRecords: new Map<string, VisitRecord>(
    mockVisitRecords.map((v) => [v.id, v])
  ),
}

function inCurrentStore<T extends { storeId?: string }>(item: T): boolean {
  return !item.storeId || item.storeId === getCurrentStoreId()
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function normalizeRemaining(value: unknown): string {
  if (typeof value === 'number') {
    const percent = value <= 1 ? value * 100 : value
    return `${Math.round(percent)}%`
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.endsWith('%')) return trimmed

    const n = Number(trimmed)
    if (!Number.isNaN(n)) {
      const percent = n <= 1 ? n * 100 : n
      return `${Math.round(percent)}%`
    }

    return trimmed
  }

  return '100%'
}

function toHiragana(text: string): string {
  return text.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  )
}

function customerSortKey(name: string, ruby: string): string {
  const raw = ruby.trim() || name.trim()
  const normalized = toHiragana(raw)
  const first = normalized.charAt(0)
  const isKana = /^[ぁ-ゖー]/.test(first)
  return `${isKana ? '0' : '1'}-${normalized}`
}

// Row mappers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCustomer(c: any, p: any = {}): Customer {
  return {
    id: c.id,
    storeId: p.store_id ?? c.store_id,
    name: c.name,
    ruby: c.ruby,
    nickname: c.nickname,
    designatedCastIds: p.designated_cast_ids ?? c.designated_cast_ids ?? [],
    isAlert: p.is_alert ?? c.is_alert ?? false,
    alertReason: p.alert_reason ?? c.alert_reason ?? '',
    memo: p.memo ?? c.memo ?? '',
    linkedCustomerIds: p.linked_customer_ids ?? c.linked_customer_ids ?? [],
    isFavorite: p.is_favorite ?? c.is_favorite ?? false,
    hasGlass: p.has_glass ?? c.has_glass ?? false,
    glassMemo: p.glass_memo ?? c.glass_memo ?? '',
    receiptNames: p.receipt_names ?? c.receipt_names ?? [],
    lastVisitDate: p.last_visit_date ?? c.last_visit_date ?? null,
    updatedAt: p.updated_at ?? c.updated_at ?? '',
    updatedBy: p.updated_by ?? c.updated_by ?? '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBottle(r: any): Bottle {
  return {
    id: r.id,
    storeId: r.store_id,
    customerId: r.customer_id,
    name: r.name,
    remaining: normalizeRemaining(r.remaining),
    openedDate: r.opened_date,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCast(r: any): Cast {
  return {
    id: r.id,
    storeId: r.store_id,
    name: r.name,
    ruby: r.ruby,
    memo: r.memo,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toVisitRecord(r: any): VisitRecord {
  return {
    id: r.id,
    storeId: r.store_id,
    customerId: r.customer_id,
    visitDate: r.visit_date,
    designatedCastIds: r.designated_cast_ids ?? [],
    inStoreCastIds: r.in_store_cast_ids ?? [],
    bottlesOpened: r.bottles_opened ?? [],
    bottlesUsed: r.bottles_used ?? [],
    memo: r.memo,
    isAlert: r.is_alert ?? false,
    alertReason: r.alert_reason ?? '',
    bottleSnapshots: Array.isArray(r.bottle_snapshots) ? r.bottle_snapshots : [],
  }
}

// ─── Customer CRUD ────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  if (!useDB) {
    return Array.from(store.customers.values()).filter(inCurrentStore).sort((a, b) =>
      customerSortKey(a.name, a.ruby).localeCompare(customerSortKey(b.name, b.ruby), 'ja')
    )
  }
  const sql = getSQL()
  const rows = await sql`
    SELECT
      c.id, c.name, c.ruby, c.nickname,
      c.designated_cast_ids, c.linked_customer_ids,
      p.store_id,
      p.designated_cast_ids AS profile_designated_cast_ids,
      p.linked_customer_ids AS profile_linked_customer_ids,
      p.memo AS profile_memo,
      p.is_alert AS profile_is_alert,
      p.alert_reason AS profile_alert_reason,
      p.is_favorite AS profile_is_favorite,
      p.has_glass AS profile_has_glass,
      p.glass_memo AS profile_glass_memo,
      p.receipt_names AS profile_receipt_names,
      p.last_visit_date AS profile_last_visit_date,
      p.updated_at AS profile_updated_at,
      p.updated_by AS profile_updated_by
    FROM customers c
    JOIN customer_store_profiles p ON p.customer_id = c.id
    WHERE p.store_id = ${getCurrentStoreId()}
  `
  return rows
    .map((row) => toCustomer(row, {
    store_id: row.store_id,
    designated_cast_ids: row.profile_designated_cast_ids,
    linked_customer_ids: row.profile_linked_customer_ids,
    memo: row.profile_memo,
    is_alert: row.profile_is_alert,
    alert_reason: row.profile_alert_reason,
    is_favorite: row.profile_is_favorite,
    has_glass: row.profile_has_glass,
    glass_memo: row.profile_glass_memo,
    receipt_names: row.profile_receipt_names,
    last_visit_date: row.profile_last_visit_date,
    updated_at: row.profile_updated_at,
    updated_by: row.profile_updated_by,
  }))
    .sort((a, b) => customerSortKey(a.name, a.ruby).localeCompare(customerSortKey(b.name, b.ruby), 'ja'))
}

export async function getCustomer(id: string): Promise<Customer | null> {
  if (!useDB) {
    const customer = store.customers.get(id) ?? null
    return customer && inCurrentStore(customer) ? customer : null
  }
  const sql = getSQL()
  const rows = await sql`
    SELECT
      c.id, c.name, c.ruby, c.nickname,
      c.designated_cast_ids, c.linked_customer_ids,
      p.store_id,
      p.designated_cast_ids AS profile_designated_cast_ids,
      p.linked_customer_ids AS profile_linked_customer_ids,
      p.memo AS profile_memo,
      p.is_alert AS profile_is_alert,
      p.alert_reason AS profile_alert_reason,
      p.is_favorite AS profile_is_favorite,
      p.has_glass AS profile_has_glass,
      p.glass_memo AS profile_glass_memo,
      p.receipt_names AS profile_receipt_names,
      p.last_visit_date AS profile_last_visit_date,
      p.updated_at AS profile_updated_at,
      p.updated_by AS profile_updated_by
    FROM customers c
    JOIN customer_store_profiles p ON p.customer_id = c.id
    WHERE c.id = ${id} AND p.store_id = ${getCurrentStoreId()}
  `
  return rows[0]
    ? toCustomer(rows[0], {
        store_id: rows[0].store_id,
        designated_cast_ids: rows[0].profile_designated_cast_ids,
        linked_customer_ids: rows[0].profile_linked_customer_ids,
        memo: rows[0].profile_memo,
        is_alert: rows[0].profile_is_alert,
        alert_reason: rows[0].profile_alert_reason,
        is_favorite: rows[0].profile_is_favorite,
        has_glass: rows[0].profile_has_glass,
        glass_memo: rows[0].profile_glass_memo,
        receipt_names: rows[0].profile_receipt_names,
        last_visit_date: rows[0].profile_last_visit_date,
        updated_at: rows[0].profile_updated_at,
        updated_by: rows[0].profile_updated_by,
      })
    : null
}

export async function createCustomer(
  data: Omit<Customer, 'id' | 'updatedAt'>
): Promise<Customer> {
  const id = generateId()
  const updatedAt = new Date().toISOString()
  if (!useDB) {
    const customer: Customer = { ...data, id, storeId: getCurrentStoreId(), updatedAt }
    store.customers.set(id, customer)
    return customer
  }
  const sql = getSQL()
  const rows = await sql`
    INSERT INTO customers (id, name, ruby, nickname, designated_cast_ids, is_alert, alert_reason, memo, linked_customer_ids, is_favorite, has_glass, glass_memo, receipt_names, last_visit_date, updated_at, updated_by)
    VALUES (${id}, ${data.name}, ${data.ruby}, ${data.nickname}, ${data.designatedCastIds}, ${data.isAlert}, ${data.alertReason}, ${data.memo}, ${data.linkedCustomerIds}, ${data.isFavorite ?? false}, ${data.hasGlass ?? false}, ${data.glassMemo ?? ''}, ${data.receiptNames ?? []}, ${data.lastVisitDate}, ${updatedAt}, ${data.updatedBy})
    RETURNING *
  `
  await sql`
    INSERT INTO customer_store_profiles (
      customer_id, store_id, designated_cast_ids, linked_customer_ids, memo, is_alert, alert_reason, is_favorite,
      has_glass, glass_memo, receipt_names, last_visit_date, updated_at, updated_by
    )
    VALUES (
      ${id}, ${getCurrentStoreId()}, ${data.designatedCastIds}, ${data.linkedCustomerIds}, ${data.memo}, ${data.isAlert}, ${data.alertReason},
      ${data.isFavorite ?? false}, ${data.hasGlass ?? false}, ${data.glassMemo ?? ''},
      ${data.receiptNames ?? []}, ${data.lastVisitDate}, ${updatedAt}, ${data.updatedBy}
    )
    ON CONFLICT (customer_id, store_id) DO UPDATE SET
      designated_cast_ids = EXCLUDED.designated_cast_ids,
      linked_customer_ids = EXCLUDED.linked_customer_ids,
      memo = EXCLUDED.memo,
      is_alert = EXCLUDED.is_alert,
      alert_reason = EXCLUDED.alert_reason,
      is_favorite = EXCLUDED.is_favorite,
      has_glass = EXCLUDED.has_glass,
      glass_memo = EXCLUDED.glass_memo,
      receipt_names = EXCLUDED.receipt_names,
      last_visit_date = EXCLUDED.last_visit_date,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by
  `
  return toCustomer(rows[0], {
    store_id: getCurrentStoreId(),
    designated_cast_ids: data.designatedCastIds,
    linked_customer_ids: data.linkedCustomerIds,
    memo: data.memo,
    is_alert: data.isAlert,
    alert_reason: data.alertReason,
    is_favorite: data.isFavorite ?? false,
    has_glass: data.hasGlass ?? false,
    glass_memo: data.glassMemo ?? '',
    receipt_names: data.receiptNames ?? [],
    last_visit_date: data.lastVisitDate,
    updated_at: updatedAt,
    updated_by: data.updatedBy,
  })
}

export async function updateCustomer(
  id: string,
  data: Partial<Omit<Customer, 'id'>>
): Promise<Customer | null> {
  if (!useDB) {
    const existing = store.customers.get(id)
    if (!existing) return null
    const updated: Customer = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
    store.customers.set(id, updated)
    return updated
  }
  const existing = await getCustomer(id)
  if (!existing) return null
  const m = { ...existing, ...data, updatedAt: new Date().toISOString() }
  const sql = getSQL()
  const rows = await sql`
    UPDATE customers SET
      name = ${m.name}, ruby = ${m.ruby}, nickname = ${m.nickname}
    WHERE id = ${id} RETURNING *
  `
  await sql`
    INSERT INTO customer_store_profiles (
      customer_id, store_id, designated_cast_ids, linked_customer_ids, memo, is_alert, alert_reason, is_favorite,
      has_glass, glass_memo, receipt_names, last_visit_date, updated_at, updated_by
    )
    VALUES (
      ${id}, ${getCurrentStoreId()}, ${m.designatedCastIds}, ${m.linkedCustomerIds}, ${m.memo}, ${m.isAlert}, ${m.alertReason},
      ${m.isFavorite ?? false}, ${m.hasGlass ?? false}, ${m.glassMemo ?? ''},
      ${m.receiptNames ?? []}, ${m.lastVisitDate}, ${m.updatedAt}, ${m.updatedBy}
    )
    ON CONFLICT (customer_id, store_id) DO UPDATE SET
      designated_cast_ids = EXCLUDED.designated_cast_ids,
      linked_customer_ids = EXCLUDED.linked_customer_ids,
      memo = EXCLUDED.memo,
      is_alert = EXCLUDED.is_alert,
      alert_reason = EXCLUDED.alert_reason,
      is_favorite = EXCLUDED.is_favorite,
      has_glass = EXCLUDED.has_glass,
      glass_memo = EXCLUDED.glass_memo,
      receipt_names = EXCLUDED.receipt_names,
      last_visit_date = EXCLUDED.last_visit_date,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by
  `
  return rows[0]
    ? toCustomer(rows[0], {
        store_id: getCurrentStoreId(),
        designated_cast_ids: m.designatedCastIds,
        linked_customer_ids: m.linkedCustomerIds,
        memo: m.memo,
        is_alert: m.isAlert,
        alert_reason: m.alertReason,
        is_favorite: m.isFavorite ?? false,
        has_glass: m.hasGlass ?? false,
        glass_memo: m.glassMemo ?? '',
        receipt_names: m.receiptNames ?? [],
        last_visit_date: m.lastVisitDate,
        updated_at: m.updatedAt,
        updated_by: m.updatedBy,
      })
    : null
}

export async function deleteCustomer(id: string): Promise<boolean> {
  if (!useDB) return store.customers.delete(id)
  const sql = getSQL()
  await sql`DELETE FROM customers WHERE id = ${id}`
  return true
}

// ─── Bottle CRUD ──────────────────────────────────────────────────────────────

export async function getBottles(): Promise<Bottle[]> {
  if (!useDB) return Array.from(store.bottles.values()).filter(inCurrentStore)
  const sql = getSQL()
  const rows = await sql`SELECT * FROM bottles WHERE store_id = ${getCurrentStoreId()}`
  return rows.map(toBottle)
}

export async function getBottlesByCustomer(customerId: string): Promise<Bottle[]> {
  if (!useDB) return Array.from(store.bottles.values()).filter((b) => b.customerId === customerId && inCurrentStore(b))
  const sql = getSQL()
  const rows = await sql`
    SELECT * FROM bottles
    WHERE customer_id = ${customerId} AND store_id = ${getCurrentStoreId()}
  `
  return rows.map(toBottle)
}

export async function getBottle(id: string): Promise<Bottle | null> {
  if (!useDB) {
    const bottle = store.bottles.get(id) ?? null
    return bottle && inCurrentStore(bottle) ? bottle : null
  }
  const sql = getSQL()
  const rows = await sql`SELECT * FROM bottles WHERE id = ${id} AND store_id = ${getCurrentStoreId()}`
  return rows[0] ? toBottle(rows[0]) : null
}

export async function createBottle(data: Omit<Bottle, 'id'>): Promise<Bottle> {
  const id = generateId()
  if (!useDB) {
    const bottle: Bottle = { ...data, id, storeId: getCurrentStoreId() }
    store.bottles.set(id, bottle)
    return bottle
  }
  const sql = getSQL()
  const rows = await sql`
    INSERT INTO bottles (id, store_id, customer_id, name, remaining, opened_date)
    VALUES (${id}, ${getCurrentStoreId()}, ${data.customerId}, ${data.name}, ${data.remaining}, ${data.openedDate})
    RETURNING *
  `
  return toBottle(rows[0])
}

export async function updateBottle(
  id: string,
  data: Partial<Omit<Bottle, 'id'>>
): Promise<Bottle | null> {
  if (!useDB) {
    const existing = store.bottles.get(id)
    if (!existing) return null
    const updated: Bottle = { ...existing, ...data, id }
    store.bottles.set(id, updated)
    return updated
  }
  const existing = await getBottle(id)
  if (!existing) return null
  const m = { ...existing, ...data }
  const sql = getSQL()
  const rows = await sql`
    UPDATE bottles SET name = ${m.name}, remaining = ${m.remaining}, opened_date = ${m.openedDate}
    WHERE id = ${id} RETURNING *
  `
  return rows[0] ? toBottle(rows[0]) : null
}

export async function deleteBottle(id: string): Promise<boolean> {
  if (!useDB) {
    const bottle = store.bottles.get(id)
    return bottle && inCurrentStore(bottle) ? store.bottles.delete(id) : false
  }
  const sql = getSQL()
  await sql`DELETE FROM bottles WHERE id = ${id} AND store_id = ${getCurrentStoreId()}`
  return true
}

// ─── Cast CRUD ────────────────────────────────────────────────────────────────

export async function getCasts(): Promise<Cast[]> {
  if (!useDB) {
    return Array.from(store.casts.values()).filter(inCurrentStore).sort((a, b) =>
      customerSortKey(a.name, a.ruby).localeCompare(customerSortKey(b.name, b.ruby), 'ja')
    )
  }
  const sql = getSQL()
  const rows = await sql`SELECT * FROM casts WHERE store_id = ${getCurrentStoreId()}`
  return rows
    .map(toCast)
    .sort((a, b) => customerSortKey(a.name, a.ruby).localeCompare(customerSortKey(b.name, b.ruby), 'ja'))
}

export async function getCast(id: string): Promise<Cast | null> {
  if (!useDB) {
    const cast = store.casts.get(id) ?? null
    return cast && inCurrentStore(cast) ? cast : null
  }
  const sql = getSQL()
  const rows = await sql`SELECT * FROM casts WHERE id = ${id} AND store_id = ${getCurrentStoreId()}`
  return rows[0] ? toCast(rows[0]) : null
}

export async function createCast(data: Omit<Cast, 'id' | 'updatedAt'>): Promise<Cast> {
  const id = generateId()
  const updatedAt = new Date().toISOString()
  if (!useDB) {
    const cast: Cast = { ...data, id, storeId: getCurrentStoreId(), updatedAt }
    store.casts.set(id, cast)
    return cast
  }
  const sql = getSQL()
  const rows = await sql`
    INSERT INTO casts (id, store_id, name, ruby, memo, updated_at, updated_by)
    VALUES (${id}, ${getCurrentStoreId()}, ${data.name}, ${data.ruby}, ${data.memo}, ${updatedAt}, ${data.updatedBy})
    RETURNING *
  `
  return toCast(rows[0])
}

export async function updateCast(
  id: string,
  data: Partial<Omit<Cast, 'id' | 'updatedAt'>>
): Promise<Cast | null> {
  if (!useDB) {
    const existing = store.casts.get(id)
    if (!existing) return null
    const updated: Cast = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
    store.casts.set(id, updated)
    return updated
  }
  const existing = await getCast(id)
  if (!existing) return null
  const m = { ...existing, ...data, updatedAt: new Date().toISOString() }
  const sql = getSQL()
  const rows = await sql`
    UPDATE casts SET name = ${m.name}, ruby = ${m.ruby}, memo = ${m.memo},
      updated_at = ${m.updatedAt}, updated_by = ${m.updatedBy}
    WHERE id = ${id} RETURNING *
  `
  return rows[0] ? toCast(rows[0]) : null
}

export async function deleteCast(id: string): Promise<boolean> {
  if (!useDB) {
    const cast = store.casts.get(id)
    return cast && inCurrentStore(cast) ? store.casts.delete(id) : false
  }
  const sql = getSQL()
  await sql`DELETE FROM casts WHERE id = ${id} AND store_id = ${getCurrentStoreId()}`
  return true
}

// ─── VisitRecord CRUD ─────────────────────────────────────────────────────────

export async function getVisitRecords(): Promise<VisitRecord[]> {
  if (!useDB) {
    return Array.from(store.visitRecords.values()).filter(inCurrentStore).sort(
      (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    )
  }
  const sql = getSQL()
  const rows = await sql`SELECT * FROM visit_records WHERE store_id = ${getCurrentStoreId()} ORDER BY visit_date DESC`
  return rows.map(toVisitRecord)
}

export async function getVisitRecordsByCustomer(customerId: string): Promise<VisitRecord[]> {
  if (!useDB) {
    return Array.from(store.visitRecords.values())
      .filter((v) => v.customerId === customerId && inCurrentStore(v))
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
  }
  const sql = getSQL()
  const rows = await sql`
    SELECT * FROM visit_records
    WHERE customer_id = ${customerId} AND store_id = ${getCurrentStoreId()}
    ORDER BY visit_date DESC
  `
  return rows.map(toVisitRecord)
}

export async function getVisitRecordsByCast(castId: string): Promise<VisitRecord[]> {
  if (!useDB) {
    return Array.from(store.visitRecords.values())
      .filter((v) => v.designatedCastIds.includes(castId) && inCurrentStore(v))
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
  }
  const sql = getSQL()
  const rows = await sql`
    SELECT * FROM visit_records
    WHERE ${castId} = ANY(designated_cast_ids) AND store_id = ${getCurrentStoreId()}
    ORDER BY visit_date DESC
  `
  return rows.map(toVisitRecord)
}

export async function getVisitRecordsByInStoreCast(castId: string): Promise<VisitRecord[]> {
  if (!useDB) {
    return Array.from(store.visitRecords.values())
      .filter((v) => v.inStoreCastIds.includes(castId) && inCurrentStore(v))
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
  }
  const sql = getSQL()
  const rows = await sql`
    SELECT * FROM visit_records
    WHERE ${castId} = ANY(in_store_cast_ids) AND store_id = ${getCurrentStoreId()}
    ORDER BY visit_date DESC
  `
  return rows.map(toVisitRecord)
}

export async function createVisitRecord(data: Omit<VisitRecord, 'id'>): Promise<VisitRecord> {
  const id = generateId()
  if (!useDB) {
    const record: VisitRecord = { ...data, id, storeId: getCurrentStoreId() }
    store.visitRecords.set(id, record)
    const customer = store.customers.get(data.customerId)
    if (customer) {
      store.customers.set(data.customerId, {
        ...customer,
        lastVisitDate: data.visitDate,
        updatedAt: new Date().toISOString(),
      })
    }
    return record
  }
  const sql = getSQL()
  const snapshotsJson = JSON.stringify(data.bottleSnapshots ?? [])
  const rows = await sql`
    INSERT INTO visit_records (id, store_id, customer_id, visit_date, designated_cast_ids, in_store_cast_ids, bottles_opened, bottles_used, memo, is_alert, alert_reason, bottle_snapshots)
    VALUES (${id}, ${getCurrentStoreId()}, ${data.customerId}, ${data.visitDate}, ${data.designatedCastIds}, ${data.inStoreCastIds}, ${data.bottlesOpened}, ${data.bottlesUsed}, ${data.memo}, ${data.isAlert ?? false}, ${data.alertReason ?? ''}, ${snapshotsJson}::jsonb)
    RETURNING *
  `
  // Update customer lastVisitDate
  await sql`
    UPDATE customers SET last_visit_date = ${data.visitDate}, updated_at = ${new Date().toISOString()}
    WHERE id = ${data.customerId}
  `
  await sql`
    UPDATE customer_store_profiles
    SET last_visit_date = ${data.visitDate}, updated_at = ${new Date().toISOString()}
    WHERE customer_id = ${data.customerId} AND store_id = ${getCurrentStoreId()}
  `
  return toVisitRecord(rows[0])
}

export async function getVisitRecord(id: string): Promise<VisitRecord | null> {
  if (!useDB) {
    const visit = store.visitRecords.get(id) ?? null
    return visit && inCurrentStore(visit) ? visit : null
  }
  const sql = getSQL()
  const rows = await sql`SELECT * FROM visit_records WHERE id = ${id} AND store_id = ${getCurrentStoreId()}`
  return rows[0] ? toVisitRecord(rows[0]) : null
}

export async function updateVisitRecord(
  id: string,
  data: Partial<Omit<VisitRecord, 'id'>>
): Promise<VisitRecord | null> {
  if (!useDB) {
    const existing = store.visitRecords.get(id)
    if (!existing) return null
    const updated: VisitRecord = { ...existing, ...data, id }
    store.visitRecords.set(id, updated)
    return updated
  }
  const existing = await getVisitRecord(id)
  if (!existing) return null
  const m = { ...existing, ...data }
  const sql = getSQL()
  const rows = await sql`
    UPDATE visit_records SET
      visit_date = ${m.visitDate}, designated_cast_ids = ${m.designatedCastIds},
      in_store_cast_ids = ${m.inStoreCastIds}, memo = ${m.memo}, is_alert = ${m.isAlert ?? false},
      alert_reason = ${m.alertReason ?? ''}
    WHERE id = ${id} RETURNING *
  `
  return rows[0] ? toVisitRecord(rows[0]) : null
}

export async function deleteVisitRecord(id: string): Promise<boolean> {
  if (!useDB) {
    const visit = store.visitRecords.get(id)
    return visit && inCurrentStore(visit) ? store.visitRecords.delete(id) : false
  }
  const sql = getSQL()
  await sql`DELETE FROM visit_records WHERE id = ${id} AND store_id = ${getCurrentStoreId()}`
  return true
}
