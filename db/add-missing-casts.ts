import { neon } from '@neondatabase/serverless'
const sql = neon('postgresql://neondb_owner:npg_rioMwOgj3N0Q@ep-round-bread-am892xho.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require')
function id() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` }

async function run() {
  // 1. 不足キャストを追加
  const missing = ['あいな', 'その', 'あゆみ', 'たかこ']
  const castIdMap: Record<string, string> = {}

  for (const name of missing) {
    const cid = id()
    await sql`INSERT INTO casts (id,name,ruby,memo,updated_at,updated_by) VALUES (${cid},${name},${name},'',now(),'') ON CONFLICT DO NOTHING`
    const r = await sql`SELECT id FROM casts WHERE name = ${name} LIMIT 1`
    castIdMap[name] = r[0].id as string
    console.log(`✓ cast追加: ${name} (id: ${castIdMap[name]})`)
  }

  // 既存キャストのIDも取得
  for (const name of ['すみれ','まりん','ゆうな','まな','さち']) {
    const r = await sql`SELECT id FROM casts WHERE name = ${name} LIMIT 1`
    if (r.length) castIdMap[name] = r[0].id as string
  }

  // 2. designated_cast_ids が空の顧客を再紐付け
  const customerCasts: Record<string, string[]> = {
    '佐々木':       ['あいな'],
    '岡本博':       ['あいな'],
    '須川':         ['あいな'],
    '伊豆':         ['あいな'],
    '幌内2号定置':  ['その', 'あゆみ'],
    '雄武鮭定置部': ['その', 'すみれ', 'あいな'],
    '畑野':         ['あいな'],
    '小松':         ['あいな'],
    '泉隆':         ['あいな', 'まりん'],
    '武藤矢口':     ['その'],
    '鈴木直良':     ['あいな'],
    '山崎':         ['あいな'],
    '雄武漁連':     ['その', 'ゆうな', 'まな'],
    '横田':         ['あいな'],
    '川上':         ['たかこ', 'あいな'],
    '雄武鮭定置部R6': ['その', 'すみれ', 'あいな'],
    '朝岡':         ['さち', 'あいな'],
  }

  for (const [name, casts] of Object.entries(customerCasts)) {
    const ids = casts.map(c => castIdMap[c]).filter(Boolean)
    if (!ids.length) continue
    const r = await sql`SELECT id FROM customers WHERE name = ${name} LIMIT 1`
    if (!r.length) continue
    await sql`UPDATE customers SET designated_cast_ids = ${ids} WHERE id = ${r[0].id}`
    console.log(`✓ 紐付け更新: ${name} → [${casts.join(', ')}]`)
  }

  console.log('\n✅ 完了')
}
run().catch(e => { console.error(e); process.exit(1) })
