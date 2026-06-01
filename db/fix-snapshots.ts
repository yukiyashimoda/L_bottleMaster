import { neon } from '@neondatabase/serverless'
const sql = neon('postgresql://neondb_owner:npg_rioMwOgj3N0Q@ep-round-bread-am892xho.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require')
async function run() {
  // bottle_snapshots が配列でない（'{}'等）レコードを '[]' に修正
  const r = await sql`
    UPDATE visit_records
    SET bottle_snapshots = '[]'
    WHERE bottle_snapshots::text = '{}' OR bottle_snapshots::text = 'null'
    RETURNING id
  `
  console.log(`✓ ${r.length}件修正`)
}
run()
