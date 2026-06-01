import { neon } from '@neondatabase/serverless'
const sql = neon('postgresql://neondb_owner:npg_rioMwOgj3N0Q@ep-round-bread-am892xho.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require')
function id() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` }

// キャスト名→ID（なければ作成）
const castCache: Record<string, string> = {}
async function getOrCreateCast(name: string): Promise<string> {
  if (castCache[name]) return castCache[name]
  const r = await sql`SELECT id FROM casts WHERE name = ${name} LIMIT 1`
  if (r.length) { castCache[name] = r[0].id as string; return castCache[name] }
  const cid = id()
  await sql`INSERT INTO casts (id,name,ruby,memo,updated_at,updated_by) VALUES (${cid},${name},${name},'',now(),'')`
  castCache[name] = cid
  console.log(`  + キャスト作成: ${name}`)
  return cid
}

async function resolveIds(names: string[]): Promise<string[]> {
  return Promise.all(names.map(getOrCreateCast))
}

// 顧客IDを名前で取得
async function custId(name: string): Promise<string | null> {
  const r = await sql`SELECT id FROM customers WHERE name = ${name} LIMIT 1`
  return r.length ? r[0].id as string : null
}

// 既存来店記録を削除して再挿入
async function setVisits(customerName: string, visits: {
  date: string
  designated: string[]
  inStore: string[]
  memo?: string
}[]) {
  const cid = await custId(customerName)
  if (!cid) { console.log(`  ⚠ 顧客なし: ${customerName}`); return }
  await sql`DELETE FROM visit_records WHERE customer_id = ${cid}`
  for (const v of visits) {
    const dIds = await resolveIds(v.designated)
    const iIds = await resolveIds(v.inStore)
    await sql`
      INSERT INTO visit_records (id,customer_id,visit_date,designated_cast_ids,in_store_cast_ids,bottles_opened,bottles_used,memo,is_alert,alert_reason,bottle_snapshots)
      VALUES (${id()},${cid},${v.date},${dIds},${iIds},'{}','{}',${v.memo??''},false,'','{}')
    `
  }
  // last_visit_date を最新訪問日に更新
  const latest = visits.map(v => v.date).sort().reverse()[0]
  await sql`UPDATE customers SET last_visit_date = ${latest} WHERE id = ${cid}`
}

// memoを特記事項のみに更新
async function setMemo(customerName: string, memo: string) {
  await sql`UPDATE customers SET memo = ${memo} WHERE name = ${customerName}`
}

async function run() {
  console.log('=== ヒロシ ===')
  await setVisits('ヒロシ', [
    { date: '2025-08-08', designated: ['あいか'], inStore: ['れい'] },
    { date: '2025-09-12', designated: ['あいか'], inStore: ['あいな', 'ともな'] },
    { date: '2026-02-13', designated: ['りこ', 'あいか'], inStore: ['ゆま', 'みり', 'りあ'], memo: 'シャンパン抜栓こぼして弁償' },
    { date: '2026-03-13', designated: ['りこ', 'りあ', 'あいか'], inStore: ['みな', 'みこと', 'ななみ'] },
  ])
  await setMemo('ヒロシ', '')
  console.log('✓')

  console.log('=== 細越恭介 ===')
  await setVisits('細越恭介', [
    { date: '2025-11-27', designated: ['あいか'], inStore: ['のぞみ'] },
  ])
  await setMemo('細越恭介', '')
  console.log('✓')

  console.log('=== 佐々木 ===')
  await setVisits('佐々木', [
    { date: '2026-04-11', designated: ['あいな'], inStore: ['ゆう'] },
  ])
  await setMemo('佐々木', 'ハートランドビール飲む、キープの鏡月は飲まない人。')
  console.log('✓')

  console.log('=== 伊豆 ===')
  await setVisits('伊豆', [
    { date: '2025-04-26', designated: ['あいな'], inStore: ['みほ', 'さち'] },
    { date: '2026-03-07', designated: ['あいな'], inStore: [], memo: '森さんと来店。あいな飲み過ぎて昼過ぎに帰った' },
    { date: '2026-04-23', designated: ['まりか', 'あいな'], inStore: ['れん', 'ともな'] },
  ])
  await setMemo('伊豆', 'お連れみほ指名森さんボトルある')
  console.log('✓')

  console.log('=== 雄武鮭定置部 ===')
  await setVisits('雄武鮭定置部', [
    { date: '2025-10-10', designated: ['その', 'ゆか', 'かおる', 'まな', 'あゆみ'], inStore: ['じゅり', 'みり'] },
  ])
  await setMemo('雄武鮭定置部', 'B4横棚にボトルある')
  console.log('✓')

  console.log('=== 小松 ===')
  await setVisits('小松', [
    { date: '2025-05-07', designated: ['あいな'], inStore: ['ゆうな', 'えみ'], memo: 'お連れ' },
    { date: '2025-06-03', designated: ['あいな'], inStore: ['ともな'] },
    { date: '2025-08-24', designated: ['あいな'], inStore: ['ななみ'] },
  ])
  await setMemo('小松', '')
  console.log('✓')

  console.log('=== 泉隆 ===')
  await setVisits('泉隆', [
    { date: '2025-06-27', designated: ['まりん'], inStore: ['あいな'] },
    { date: '2025-07-11', designated: ['まりん'], inStore: ['あざみ'] },
  ])
  await setMemo('泉隆', 'まりん指名はボトルなし')
  console.log('✓')

  // 来店履歴がない顧客のmemoも整理
  await setMemo('須川', '指名被ると怒る痛い人')
  await setMemo('幌内2号定置', 'らら指名まっこさんもボトル共有')
  await setMemo('山崎', 'りな指名伊藤一吉さんお連れ。お連れがいる時は言われるまでボトルは出さない。')
  await setMemo('朝岡', '小さい人。白州は調律棚置き')
  await setMemo('雄武鮭定置部R6', '山崎SM調律棚置き')
  await setMemo('横田', '前回(9/20) SV3入った')

  const [cnt] = await sql`SELECT count(*) FROM visit_records`
  console.log(`\n✅ 完了。来店記録総数: ${cnt.count}件`)
}
run().catch(e => { console.error(e); process.exit(1) })
