import { neon } from '@neondatabase/serverless'

const sql = neon('postgresql://neondb_owner:npg_rioMwOgj3N0Q@ep-round-bread-am892xho.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require')

function id() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` }

async function run() {
  // 1. あいか を casts に追加
  const existingCast = await sql`SELECT id FROM casts WHERE name = 'あいか' LIMIT 1`
  let aikaId: string
  if (existingCast.length > 0) {
    aikaId = existingCast[0].id as string
    console.log(`✓ cast: あいか already exists (id: ${aikaId})`)
  } else {
    aikaId = id()
    await sql`
      INSERT INTO casts (id, name, ruby, memo, updated_at, updated_by)
      VALUES (${aikaId}, 'あいか', 'あいか', '', now(), '')
    `
    console.log(`✓ cast: あいか inserted (id: ${aikaId})`)
  }

  // 2. ヒロシ を customers に追加
  const existingH = await sql`SELECT id FROM customers WHERE name = 'ヒロシ' LIMIT 1`
  let hiroshiId: string
  if (existingH.length > 0) {
    hiroshiId = existingH[0].id as string
    console.log(`✓ customer: ヒロシ already exists (id: ${hiroshiId})`)
  } else {
    hiroshiId = id()
    await sql`
      INSERT INTO customers
        (id, name, ruby, nickname, designated_cast_ids, is_alert, alert_reason, memo,
         linked_customer_ids, is_favorite, has_glass, glass_memo, receipt_names,
         last_visit_date, updated_at, updated_by)
      VALUES
        (${hiroshiId}, 'ヒロシ', 'ひろし', '6000様', ${[aikaId]},
         false, '', '2026-03-13りこ・りあ指名来店。2026-02-13シャンパン弁償。タグ:ケンタ',
         '{}', false, false, '', '{}',
         '2026-03-13', '2026-03-13', '')
    `
    console.log(`✓ customer: ヒロシ inserted (id: ${hiroshiId})`)
  }

  // ヒロシのボトル ※remaining は '70%' 形式（整数%付き文字列）
  const hiroshiBottles = [
    { name: 'いいちこ陶器', remaining: '70%' },
    { name: '角サン',       remaining: '80%' },
    { name: '吉四六86',     remaining: '100%' },
    { name: 'ローヤル31',   remaining: '100%' },
    { name: 'いいちこSP',   remaining: '0%', status: 'finished' },
  ]
  for (const b of hiroshiBottles) {
    const bid = id()
    await sql`
      INSERT INTO bottles (id, customer_id, name, remaining, opened_date, status)
      VALUES (${bid}, ${hiroshiId}, ${b.name}, ${b.remaining}, '2026-03-13', ${b.status ?? 'active'})
    `
  }
  console.log('  ✓ ヒロシ: ボトル5本')

  // 3. 細越恭介 を customers に追加
  const existingK = await sql`SELECT id FROM customers WHERE name = '細越恭介' LIMIT 1`
  let hosokoshiId: string
  if (existingK.length > 0) {
    hosokoshiId = existingK[0].id as string
    console.log(`✓ customer: 細越恭介 already exists (id: ${hosokoshiId})`)
  } else {
    hosokoshiId = id()
    await sql`
      INSERT INTO customers
        (id, name, ruby, nickname, designated_cast_ids, is_alert, alert_reason, memo,
         linked_customer_ids, is_favorite, has_glass, glass_memo, receipt_names,
         last_visit_date, updated_at, updated_by)
      VALUES
        (${hosokoshiId}, '細越恭介', 'ほそこし', '', ${[aikaId]},
         false, '', '2025-11-27 のぞみ場内。',
         '{}', false, false, '', '{}',
         '2025-11-27', '2025-11-27', '')
    `
    console.log(`✓ customer: 細越恭介 inserted (id: ${hosokoshiId})`)
  }

  const bid2 = id()
  await sql`
    INSERT INTO bottles (id, customer_id, name, remaining, opened_date, status)
    VALUES (${bid2}, ${hosokoshiId}, '鍛高譚梅酒36', '40%', '2025-11-27', 'active')
  `
  console.log('  ✓ 細越恭介: ボトル1本')

  const [cnt] = await sql`SELECT count(*) FROM customers`
  console.log(`\n✅ 完了。顧客総数: ${cnt.count}件`)
}

run().catch(e => { console.error(e); process.exit(1) })
