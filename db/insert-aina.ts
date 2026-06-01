import { neon } from '@neondatabase/serverless'
const sql = neon('postgresql://neondb_owner:npg_rioMwOgj3N0Q@ep-round-bread-am892xho.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require')

function id() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` }

// キャスト名 → public.casts.id を解決
async function castId(name: string): Promise<string | null> {
  const r = await sql`SELECT id FROM casts WHERE name = ${name} LIMIT 1`
  return r.length ? r[0].id as string : null
}

// 顧客を upsert して id を返す
async function upsertCustomer(c: {
  name: string; ruby?: string; nickname?: string; aliases: string[]
  tag?: string; memo?: string; updated_at: string
}): Promise<string> {
  const existing = await sql`SELECT id FROM customers WHERE name = ${c.name} LIMIT 1`
  if (existing.length) {
    await sql`UPDATE customers SET aliases=${c.aliases}, tag=${c.tag??null}, memo=${c.memo??''}, updated_at=${c.updated_at} WHERE id=${existing[0].id}`
    await sql`DELETE FROM bottles WHERE customer_id=${existing[0].id}`
    return existing[0].id as string
  }
  const r = await sql`
    INSERT INTO customers (id,name,ruby,nickname,designated_cast_ids,is_alert,alert_reason,memo,linked_customer_ids,is_favorite,has_glass,glass_memo,receipt_names,last_visit_date,updated_at,updated_by,aliases,tag)
    VALUES (${id()},${c.name},${c.ruby??''},${c.nickname??''},'{}',false,'',${c.memo??''},'{}',false,false,'','{}',${c.updated_at},${c.updated_at},'',${c.aliases},${c.tag??null})
    RETURNING id`
  return r[0].id as string
}

// ボトルを挿入
async function addBottle(customerId: string, name: string, remaining: string, opened: string, status = 'active') {
  await sql`INSERT INTO bottles (id,customer_id,name,remaining,opened_date,status) VALUES (${id()},${customerId},${name},${remaining},${opened},${status})`
}

// designated_cast_ids を更新
async function setCasts(customerId: string, castNames: string[]) {
  const ids: string[] = []
  for (const n of castNames) { const c = await castId(n); if (c) ids.push(c) }
  if (ids.length) await sql`UPDATE customers SET designated_cast_ids=${ids} WHERE id=${customerId}`
}

async function run() {
  const CUSTOMERS: {
    name: string; ruby?: string; nickname?: string; aliases: string[]
    tag?: string; memo?: string; updated_at: string
    casts: string[]
    bottles: { name: string; remaining: string; status?: string }[]
  }[] = [
    {
      name: '佐々木', aliases: ['佐々木様'],
      tag: 'なおちゃん',
      memo: 'ハートランドビール飲む、キープの鏡月は飲まない人。R8 4/11 ゆう場内',
      updated_at: '2026-05-30', casts: ['あいな'],
      bottles: [{ name: '鏡月175', remaining: '50%' }],
    },
    {
      name: '岡本博', aliases: ['岡本博様'],
      updated_at: '2025-05-31', casts: ['あいな'],
      bottles: [{ name: 'サントリー角193', remaining: '80%' }],
    },
    {
      name: '須川', aliases: ['須川様', 'すがわ様'],
      memo: '指名被ると怒る痛い人',
      updated_at: '2026-05-22', casts: ['あいな'],
      bottles: [{ name: '鏡月261', remaining: '20%' }],
    },
    {
      name: '伊豆', aliases: ['伊豆様'],
      tag: 'イズ',
      memo: 'お連れみほ指名森さんボトルある。R7 4/26 みほ・さち場内。R8 3/7 森さんと来店、あいな飲み過ぎて昼過ぎに帰った。4/23 まりか指名と来店、れん・ともな場内',
      updated_at: '2026-04-23', casts: ['あいな'],
      bottles: [{ name: 'シーバス12y61', remaining: '30%' }],
    },
    {
      name: '幌内2号定置', aliases: ['幌内2号定置様', '雄武定置様'],
      tag: '雄武鮭定置',
      memo: 'らら指名まっこさんもボトル共有',
      updated_at: '2026-02-13', casts: ['その', 'あゆみ'],
      bottles: [
        { name: '鏡月136', remaining: '30%' },
        { name: '角サン161', remaining: '80%' },
      ],
    },
    {
      name: '雄武鮭定置部', aliases: ['おうむ'],
      memo: 'B4横棚にボトルある。R7 10/10 その・ゆか・かおる・まな・あゆみ指名で来店、じゅり・みり場内',
      updated_at: '2026-02-13', casts: ['その', 'すみれ', 'あいな'],
      bottles: [
        { name: '富乃宝山', remaining: '80%' },
        { name: '山崎SM', remaining: '0%', status: 'finished' },
      ],
    },
    {
      name: '畑野', aliases: ['畑野様', 'はたの'],
      updated_at: '2026-02-13', casts: ['あいな'],
      bottles: [{ name: '鏡月185', remaining: '0%' }],
    },
    {
      name: '小松', aliases: ['小松様'],
      memo: 'R7 5/7 お連れゆうな・えみ場内。6/3 ともな場内。8/24 ななみ場内',
      updated_at: '2025-08-24', casts: ['あいな'],
      bottles: [{ name: '鍛高譚31', remaining: '60%' }],
    },
    {
      name: '泉隆', aliases: ['泉隆様', 'たかし'],
      tag: '隆',
      memo: 'まりん指名はボトルなし。R7 6/27 あいな場内。7/11 まりん指名とあざみ場内来店',
      updated_at: '2025-07-11', casts: ['あいな', 'まりん'],
      bottles: [{ name: '山崎12y34', remaining: '20%' }],
    },
    {
      name: '武藤矢口', aliases: ['武藤', '矢口'],
      tag: '全酪連様',
      updated_at: '2023-07-12', casts: ['その'],
      bottles: [{ name: 'ローヤル8', remaining: '0%', status: 'finished' }],
    },
    {
      name: '鈴木直良', aliases: ['鈴木直良様'],
      updated_at: '2025-02-19', casts: ['あいな'],
      bottles: [{ name: '山崎SM63', remaining: '80%' }],
    },
    {
      name: '山崎', aliases: ['山崎様'],
      memo: 'りな指名伊藤一吉さんお連れ。お連れがいる時は言われるまでボトルは出さない。',
      updated_at: '2025-01-30', casts: ['あいな'],
      bottles: [{ name: '黒霧島10', remaining: '40%' }],
    },
    {
      name: '雄武漁連', aliases: ['雄武漁連様', 'おうむ'],
      updated_at: '2025-02-13', casts: ['その', 'ゆうな', 'まな'],
      bottles: [{ name: '鏡月179', remaining: '40%' }],
    },
    {
      name: '横田', aliases: ['横田様', '岡本様'],
      memo: '前回(9/20) SV3入った',
      updated_at: '2023-09-26', casts: ['あいな'],
      bottles: [{ name: '角サン88', remaining: '80%' }],
    },
    {
      name: '川上', aliases: ['川上様'],
      updated_at: '2024-10-19', casts: ['たかこ', 'あいな'],
      bottles: [{ name: '知多56', remaining: '60%' }],
    },
    {
      name: '雄武鮭定置部R6', aliases: ['おうむ'],
      memo: '山崎SM調律棚置き',
      updated_at: '2024-12-11', casts: ['その', 'すみれ', 'あいな'],
      bottles: [
        { name: '山崎SM', remaining: '70%' },
        { name: '富乃宝山', remaining: '70%' },
      ],
    },
    {
      name: '朝岡', aliases: ['朝岡様'],
      memo: '小さい人。白州は調律棚置き',
      updated_at: '2024-02-21', casts: ['さち', 'あいな'],
      bottles: [
        { name: '白州SM', remaining: '80%' },
        { name: '碧', remaining: '0%', status: 'finished' },
      ],
    },
  ]

  for (const c of CUSTOMERS) {
    const cid = await upsertCustomer(c)
    for (const b of c.bottles) {
      await addBottle(cid, b.name, b.remaining, c.updated_at, b.status ?? 'active')
    }
    await setCasts(cid, c.casts)
    console.log(`✓ ${c.name}`)
  }

  const [cnt] = await sql`SELECT count(*) FROM customers`
  console.log(`\n✅ 完了。顧客総数: ${cnt.count}件`)
}
run().catch(e => { console.error(e); process.exit(1) })
