import { neon } from '@neondatabase/serverless'
const sql = neon('postgresql://neondb_owner:npg_rioMwOgj3N0Q@ep-round-bread-am892xho.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require')

async function run() {
  // ヒロシのボトル修正
  const fixes: { name: string; remaining: string }[] = [
    { name: 'いいちこ陶器', remaining: '70%' },
    { name: '角サン',       remaining: '80%' },
    { name: '吉四六86',     remaining: '100%' },
    { name: 'ローヤル31',   remaining: '100%' },
    { name: 'いいちこSP',   remaining: '0%'   },
  ]

  const hiroshi = await sql`SELECT id FROM customers WHERE name = 'ヒロシ' LIMIT 1`
  const hiroshiId = hiroshi[0].id as string
  for (const f of fixes) {
    const r = await sql`
      UPDATE bottles SET remaining = ${f.remaining}
      WHERE customer_id = ${hiroshiId} AND name = ${f.name}
      RETURNING name, remaining
    `
    if (r.length) console.log(`✓ ヒロシ/${f.name}: ${r[0].remaining}`)
    else console.log(`  skipped: ${f.name} not found`)
  }

  // 細越恭介のボトル修正
  const hosokoshi = await sql`SELECT id FROM customers WHERE name = '細越恭介' LIMIT 1`
  const hosokoshiId = hosokoshi[0].id as string
  const r2 = await sql`
    UPDATE bottles SET remaining = '40%'
    WHERE customer_id = ${hosokoshiId} AND name = '鍛高譚梅酒36'
    RETURNING name, remaining
  `
  if (r2.length) console.log(`✓ 細越恭介/鍛高譚梅酒36: ${r2[0].remaining}`)

  console.log('\n✅ 完了')
}
run()
