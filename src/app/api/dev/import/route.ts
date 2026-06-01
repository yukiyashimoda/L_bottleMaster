import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

type BottleInput = {
  brand: string; number?: number | null; remaining?: string | number | null
  status: 'active' | 'finished'; location?: string | null; bottle_tag?: string | null
}
type CustomerInput = {
  name: string; aliases: string[]; tags?: string[] | null
  company?: string | null; appearance?: string | null
  location?: string | null; note?: string | null; updated_at: string
  bottles: BottleInput[]
  staff: { name: string; role: string; is_current: boolean }[]
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// 残量を '70%' 形式に正規化（数値0.7→'70%'、文字列'70%'→そのまま）
function toRemaining(r: string | number | null | undefined): string {
  if (r == null) return ''
  if (typeof r === 'number') return `${Math.round(r * 100)}%`
  if (String(r).includes('%')) return String(r)
  const n = parseFloat(String(r))
  if (!isNaN(n) && n <= 1) return `${Math.round(n * 100)}%`
  return String(r)
}

export async function POST(req: NextRequest) {
  const { customers, mode = 'skip' } = await req.json() as {
    customers: CustomerInput[]
    mode?: 'skip' | 'update'
  }

  const sql = neon(process.env.DATABASE_URL!)
  const results: { name: string; status: 'inserted' | 'skipped' | 'error'; message?: string }[] = []

  for (const c of customers) {
    try {
      const existing = await sql`
        SELECT id FROM public.customers WHERE name = ${c.name} LIMIT 1
      `

      if (existing.length > 0 && mode === 'skip') {
        results.push({ name: c.name, status: 'skipped', message: '既存顧客' })
        continue
      }

      let customerId: string

      if (existing.length > 0 && mode === 'update') {
        // 既存を更新
        await sql`
          UPDATE public.customers SET
            aliases    = ${c.aliases},
            tags       = ${c.tags ?? []},
            company    = ${c.company ?? null},
            appearance = ${c.appearance ?? null},
            memo       = ${c.note ?? ''},
            updated_at = ${c.updated_at}
          WHERE id = ${existing[0].id as string}
        `
        customerId = existing[0].id as string
        await sql`DELETE FROM public.bottles WHERE customer_id = ${customerId}`
      } else {
        // 新規挿入
        const rows = await sql`
          INSERT INTO public.customers
            (id, name, ruby, nickname,
             designated_cast_ids, is_alert, alert_reason, memo,
             linked_customer_ids, is_favorite, has_glass, glass_memo, receipt_names,
             last_visit_date, updated_at, updated_by,
             aliases, tag, company, appearance)
          VALUES
            (${genId()}, ${c.name}, '', '',
             '{}', false, '', ${c.note ?? ''},
             '{}', false, false, '', '{}',
             ${c.updated_at}, ${c.updated_at}, '',
             ${c.aliases}, ${(c.tags ?? []).join(',') || null}, ${c.company ?? null}, ${c.appearance ?? null})
          RETURNING id
        `
        customerId = rows[0].id as string
      }

      // ボトル挿入（brand + number を name に結合）
      for (const b of c.bottles) {
        const bottleName = b.brand + (b.number != null ? String(b.number) : '')
        await sql`
          INSERT INTO public.bottles (id, customer_id, name, remaining, opened_date, status)
          VALUES (
            ${genId()}, ${customerId},
            ${bottleName},
            ${toRemaining(b.remaining)},
            ${c.updated_at},
            ${b.status}
          )
        `
      }

      // designated_cast_ids を public.casts から解決して更新
      const castIds: string[] = []
      for (const cs of c.staff) {
        if (!cs.is_current) continue
        const castRows = await sql`
          SELECT id FROM public.casts WHERE name = ${cs.name} LIMIT 1
        `
        if (castRows.length) castIds.push(castRows[0].id as string)
      }
      if (castIds.length > 0) {
        await sql`
          UPDATE public.customers SET designated_cast_ids = ${castIds}
          WHERE id = ${customerId}
        `
      }

      results.push({ name: c.name, status: 'inserted' })
    } catch (e) {
      results.push({ name: c.name, status: 'error', message: String(e) })
    }
  }

  return NextResponse.json({
    inserted: results.filter(r => r.status === 'inserted').length,
    skipped:  results.filter(r => r.status === 'skipped').length,
    errors:   results.filter(r => r.status === 'error').length,
    results,
  })
}

// GET: 既存顧客名一覧（重複チェック用）
export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`SELECT name FROM public.customers ORDER BY name`
  return NextResponse.json(rows.map(r => r.name))
}
