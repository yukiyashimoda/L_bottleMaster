import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  await sql`ALTER TABLE visit_records ADD COLUMN IF NOT EXISTS is_alert BOOLEAN NOT NULL DEFAULT false`
  await sql`ALTER TABLE visit_records ADD COLUMN IF NOT EXISTS alert_reason TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_glass BOOLEAN NOT NULL DEFAULT false`
  return Response.json({ ok: true, message: 'Migration complete' })
}
