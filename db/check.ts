import { neon } from '@neondatabase/serverless'
const sql = neon('postgresql://neondb_owner:npg_rioMwOgj3N0Q@ep-round-bread-am892xho.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require')
async function run() {
  const rows = await sql`SELECT name, remaining, opened_date FROM bottles ORDER BY opened_date DESC LIMIT 10`
  console.log(rows)
}
run()
