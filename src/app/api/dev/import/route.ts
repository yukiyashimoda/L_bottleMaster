import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

type BottleInput = {
  brand: string; number?: number | null; remaining?: number | null
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
             ${c.aliases}, ${c.tags ?? []}, ${c.company ?? null}, ${c.appearance ?? null})
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
            ${b.remaining != null ? String(b.remaining) : ''},
            ${c.updated_at},
            ${b.status}
          )
        `
      }

      // customer_staff（core.staff と照合）
      for (const cs of c.staff) {
        const staffRows = await sql`
          SELECT id FROM core.staff WHERE name = ${cs.name} LIMIT 1
        `
        if (!staffRows.length) continue
        // public.customers の id (text) と core.staff の id (int) をリンク
        await sql`
          INSERT INTO bottle.customer_staff (customer_id, staff_id, role, is_current)
          VALUES (
            (SELECT id::int FROM core.customers WHERE name = ${c.name} LIMIT 1),
            ${staffRows[0].id as number}, ${cs.role}, ${cs.is_current}
          )
          ON CONFLICT (customer_id, staff_id, role) DO UPDATE SET is_current = EXCLUDED.is_current
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
