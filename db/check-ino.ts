import { neon } from '@neondatabase/serverless'
const sql = neon('postgresql://neondb_owner:npg_rioMwOgj3N0Q@ep-round-bread-am892xho.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require')
async function run() {
  const c = await sql`SELECT * FROM customers WHERE name = 'いの' LIMIT 1`
  console.log('CUSTOMER:', JSON.stringify(c[0], null, 2))
  const v = await sql`SELECT * FROM visit_records WHERE customer_id = ${c[0].id} ORDER BY visit_date`
  console.log('\nVISIT_RECORDS count:', v.length)
  if (v.length) console.log('SAMPLE:', JSON.stringify(v[0], null, 2))
}
run()
