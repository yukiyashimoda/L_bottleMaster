import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_rioMwOgj3N0Q@ep-round-bread-am892xho.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require'
const sql = neon(DATABASE_URL)

// ============================================================
// スタッフ（キャスト）
// ============================================================
const STAFF = [
  { name: 'あい',   is_active: true  },
  { name: 'まな',   is_active: true  },
  { name: 'かれん', is_active: true  },
  { name: 'さち',   is_active: true  },
  { name: 'かおる', is_active: true  },
  { name: 'みれん', is_active: true  },
  { name: 'あんな', is_active: true  },
  { name: 'りこ',   is_active: true  },
  { name: 'すみれ', is_active: true  },
  { name: 'みのり', is_active: false },
  { name: 'めぐみ', is_active: true  },
]

// ============================================================
// 顧客データ
// ============================================================
type BottleSeed = {
  brand: string; number?: number; remaining?: number
  status: 'active' | 'finished'; location?: string; bottle_tag?: string
  registered_at?: string
}
type CustomerSeed = {
  name: string; aliases: string[]; tag?: string
  company?: string; appearance?: string; location?: string; note?: string
  updated_at: string
  bottles: BottleSeed[]
  staff: { name: string; role: string; is_current: boolean }[]
}

const CUSTOMERS: CustomerSeed[] = [
  {
    name: 'いの', aliases: ['あい', 'いの様'],
    location: 'カウンター棚F',
    note: 'タグにいのさん本人の証明写真貼ってある',
    updated_at: '2026-01-31',
    bottles: [
      { brand: '角サン', remaining: 0.7, status: 'active', location: '調律棚置き' },
      { brand: '碧 知多17', status: 'finished' },
      { brand: 'シーバスミズナラ', status: 'finished' },
      { brand: 'デュワーズホワイト', status: 'finished' },
      { brand: 'ハーパー8y', status: 'finished' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '入江', aliases: ['いりえくん様', 'けいじろう'],
    appearance: 'メガネかけた見た目オラオラな若い人',
    updated_at: '2025-12-22',
    bottles: [
      { brand: 'チャミスル', number: 55, remaining: 0.1, status: 'active' },
      { brand: '白州SM', number: 24, status: 'finished' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '北島', aliases: ['きたじま様'],
    tag: 'まーくん',
    note: '鏡プレタグ:きたじま きんみやタグ:まーくん。R7/12/11 魔女ゆず×1、パインボトル×1キープ',
    updated_at: '2026-01-29',
    bottles: [
      { brand: 'キンミヤ', number: 14, remaining: 0.6, status: 'active', bottle_tag: 'まーくん' },
      { brand: '鏡月プレミアム', number: 29, status: 'finished', bottle_tag: 'きたじま' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '山藤たくや', aliases: ['たくや様'],
    note: 'お連れさち指名高畠様',
    updated_at: '2025-04-11',
    bottles: [
      { brand: '黒霧島', number: 49, remaining: 0.4, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: 'たけし', aliases: ['たけちゃん様', 'たけし様'],
    note: 'お茶しか飲まない人',
    updated_at: '2026-01-26',
    bottles: [
      { brand: 'チャミスル', number: 38, remaining: 0.05, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: 'はじめ', aliases: ['はじめ様'],
    tag: 'はじめん',
    updated_at: '2026-01-17',
    bottles: [
      { brand: '黒霧島', number: 41, remaining: 0.2, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '早川', aliases: ['はやさん様'],
    note: 'R8/4/30 飲み切り済',
    updated_at: '2024-07-18',
    bottles: [
      { brand: 'チャミスル', number: 35, remaining: 0.6, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: 'ひでちまる', aliases: ['ひでちまる様'],
    tag: 'ひで',
    note: '体弱い方',
    location: '調律棚',
    updated_at: '2025-12-19',
    bottles: [
      { brand: '鏡月', number: 163, remaining: 0.7, status: 'active', location: '調律棚置き' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: 'ひやまばし', aliases: ['ひやまばし様', 'しばざき', 'たける'],
    updated_at: '2023-08-01',
    bottles: [
      { brand: '吉四六', number: 39, remaining: 0.6, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: 'まき会長', aliases: ['まき会長様', 'まき'],
    updated_at: '2024-09-25',
    bottles: [
      { brand: '角サン', number: 84, remaining: 0.8, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: 'やすし', aliases: ['やす様', 'やすし様'],
    tag: 'やっくん',
    note: 'お連れ様 あんな・あい。みのり指名→まな指名へ(推定)',
    updated_at: '2024-01-10',
    bottles: [
      { brand: '鏡月', number: 11, remaining: 0.8, status: 'active' },
    ],
    staff: [
      { name: 'まな',   role: '指名', is_current: true  },
      { name: 'みのり', role: '元指名', is_current: false },
      { name: 'あんな', role: '場内', is_current: true  },
      { name: 'あい',   role: '場内', is_current: true  },
    ],
  },
  {
    name: 'よしろう', aliases: ['よしろう様'],
    tag: 'よしりん',
    note: '棚5のキンミヤに吉四六とハーパー8yのタグ掛けて保管',
    updated_at: '2026-01-26',
    bottles: [
      { brand: 'キンミヤ',   number: 12, remaining: 0.6, status: 'active', location: '棚5' },
      { brand: '吉四六',     number: 96, remaining: 0.4, status: 'active' },
      { brand: 'ハーパー8y', number: 24, remaining: 0.8, status: 'active' },
      { brand: '響JH',       status: 'finished' },
      { brand: 'ラフロイグ10y', status: 'finished' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: 'わたなべ', aliases: ['わたなべ様'],
    note: 'お連れまりか指名ボトルなし',
    updated_at: '2025-05-17',
    bottles: [
      { brand: '知多', number: 27, remaining: 0.2, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '佐藤恵一', aliases: ['けーいち様', 'けいいち様'],
    tag: 'けーちゃん',
    company: '合同会社ティエムティ',
    location: 'カウンター棚3',
    note: '白樫様連れ別でボトルあり',
    updated_at: '2026-05-23',
    bottles: [
      { brand: 'キンミヤ',         number: 22, remaining: 0.7, status: 'active' },
      { brand: 'だいやめ',                      remaining: 0.3, status: 'active' },
      { brand: 'シーバスミズナラ18y',            remaining: 0.7, status: 'active' },
    ],
    staff: [{ name: 'みれん', role: '指名', is_current: true }],
  },
  {
    name: '北村', aliases: ['北村様'],
    updated_at: '2025-09-24',
    bottles: [
      { brand: '山崎SM', number: 77, remaining: 1.0, status: 'active' },
      { brand: '黒霧島', number: 69, remaining: 1.0, status: 'active' },
      { brand: '鏡月',   number: 216, status: 'finished' },
      { brand: 'バランタイン12y', number: 21, status: 'finished' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '十勝とおる', aliases: ['十勝', 'トオル様', 'とおる様'],
    note: 'お連れゆか・あや・らら指名ボトルなし',
    updated_at: '2025-06-26',
    bottles: [
      { brand: '白州SM', number: 40, remaining: 0.2, status: 'active' },
      { brand: 'バランタイン12y', number: 32, status: 'finished' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '吉本', aliases: ['吉本様'],
    tag: 'たっち',
    updated_at: '2025-06-10',
    bottles: [
      { brand: '富乃宝山', remaining: 0.2, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '吉田', aliases: ['吉田様'],
    updated_at: '2025-12-17',
    bottles: [
      { brand: '知多', number: 8, remaining: 0.8, status: 'active' },
    ],
    staff: [
      { name: 'あい',   role: '指名', is_current: true },
      { name: 'かおる', role: '場内', is_current: true },
    ],
  },
  {
    name: '天野', aliases: ['天野様'],
    note: 'クラブ響もいかれてるお客様',
    updated_at: '2025-10-02',
    bottles: [
      { brand: 'シーバス12yミズナラ', number: 3, remaining: 0.8, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '山内', aliases: ['山内様'],
    note: '早い時間帯に来店して窓側の席いつも座る人',
    updated_at: '2026-05-19',
    bottles: [
      { brand: '角サン', number: 140, remaining: 0.8, status: 'active' },
    ],
    staff: [
      { name: 'あい',   role: '指名', is_current: true },
      { name: 'あんな', role: '場内', is_current: true },
      { name: 'りこ',   role: '場内', is_current: true },
    ],
  },
  {
    name: '山口', aliases: ['山口様'],
    tag: 'ひで',
    appearance: 'メガネかけた小柄なおじさん',
    updated_at: '2025-12-17',
    bottles: [
      { brand: '角サン', number: 56, remaining: 0.4, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '山岸', aliases: ['山岸様', '新ちゃん様', 'しんちゃん様'],
    tag: 'NEOGROW',
    location: 'カウンター棚2',
    note: 'お連れ苗村さんボトル共有',
    updated_at: '2026-05-27',
    bottles: [
      { brand: '山崎12y', remaining: 0.5, status: 'active', location: 'カウンター棚2' },
      { brand: '魔王',     remaining: 0.7, status: 'active', location: 'カウンター棚2' },
      { brand: '白州12y', remaining: 0.7, status: 'active', location: 'カウンター棚2' },
    ],
    staff: [],
  },
  {
    name: '新田', aliases: ['新田様'],
    tag: 'にっぴぃ',
    note: '連れ：らむ場内。さち指名やまぽん様ボトルあり。めい指名ボトルなし',
    updated_at: '2025-09-29',
    bottles: [
      { brand: 'ジャックダニエル', number: 7, remaining: 0.9, status: 'active' },
      { brand: 'チャミスル', number: 58, status: 'finished' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '村山', aliases: ['村山様'],
    tag: '村山・小沼',
    note: 'お連れ大槻さん(株)日装ツツミワークスでボトルあり。山崎12yに鏡月のタグ掛けて保管',
    updated_at: '2025-12-13',
    bottles: [
      { brand: '鏡月',   number: 262, remaining: 0.8, status: 'active' },
      { brand: '山崎12y',            remaining: 0.4, status: 'active' },
      { brand: 'サントリーアオ', number: 50, status: 'finished' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '横山', aliases: ['横山様', '石崎様'],
    note: 'めぐみ指名 横山さんボトル共有',
    updated_at: '2025-12-15',
    bottles: [
      { brand: 'バランタイン17y', number: 11, remaining: 1.0, status: 'active' },
    ],
    staff: [
      { name: 'あい',   role: '指名', is_current: true },
      { name: 'めぐみ', role: '指名', is_current: true },
    ],
  },
  {
    name: '池田・はんだ', aliases: ['池田様', 'はんだ様'],
    tag: 'Hなはんちゃん',
    note: 'すみれ指名はんだ様・あい指名池田様。緑の会の人。ボトル共有',
    updated_at: '2026-05-08',
    bottles: [
      { brand: 'ハーパー8y', number: 20, remaining: 0.3, status: 'active' },
    ],
    staff: [
      { name: 'あい',   role: '指名', is_current: true },
      { name: 'すみれ', role: '指名', is_current: true },
    ],
  },
  {
    name: '畠山京助', aliases: ['畠山京助様'],
    location: 'カウンター棚F',
    updated_at: '2026-01-14',
    bottles: [
      { brand: 'デュワーズホワイト', remaining: 0.8, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '菊池', aliases: ['菊池様', 'きくち様'],
    tag: 'キクタク・たっく',
    updated_at: '2025-08-23',
    bottles: [
      { brand: '鏡月', number: 68, remaining: 0.8, status: 'active' },
    ],
    staff: [
      { name: 'かれん', role: '指名', is_current: true },
      { name: 'あい',   role: '場内', is_current: true },
    ],
  },
  {
    name: '藤田', aliases: ['藤田様'],
    tag: 'フジタ',
    updated_at: '2025-04-30',
    bottles: [
      { brand: 'ミズナラ12y', number: 67, remaining: 0.2, status: 'active' },
    ],
    staff: [],
  },
  {
    name: '野澤', aliases: ['野澤様', 'のざわ様'],
    tag: 'キングかず',
    note: 'だいやめに黒霧島66のタグ掛けて保管',
    updated_at: '2026-01-17',
    bottles: [
      { brand: 'だいやめ',            remaining: 0.1, status: 'active' },
      { brand: '黒霧島', number: 66, remaining: 0.1, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '金子', aliases: ['金子様'],
    note: 'お連れらら指名遠藤さんボトルあり',
    updated_at: '2026-02-17',
    bottles: [
      { brand: 'シーバスミズナラ12y', number: 84, remaining: 0.2, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '高畠', aliases: ['高畠様', 'たかはた様'],
    tag: 'たくや',
    note: 'あい指名山藤たくやさんボトル共有',
    updated_at: '2026-01-22',
    bottles: [
      { brand: '黒霧島', number: 53, remaining: 0.5, status: 'active' },
    ],
    staff: [
      { name: 'さち', role: '指名', is_current: true },
      { name: 'あい', role: '場内', is_current: true },
    ],
  },
  {
    name: '高石広一', aliases: ['高石広一様'],
    tag: 'こうちゃん',
    location: 'カウンター富乃宝山の棚',
    updated_at: '2025-12-02',
    bottles: [
      { brand: '富乃宝山', remaining: 0.9, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '黒沢', aliases: ['黒沢様', 'クロちゃん'],
    tag: '黒ちゃん',
    updated_at: '2025-12-10',
    bottles: [
      { brand: 'ジョニーウォーカー黒', number: 36, remaining: 0.9, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: '龍ちゃん', aliases: ['龍ちゃん様', 'りゅうちゃん'],
    updated_at: '2026-01-30',
    bottles: [
      { brand: '吉四六',   number: 45, remaining: 0.1, status: 'active' },
      { brand: 'チャミスル', number: 89, status: 'finished' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
  {
    name: 'ひろき', aliases: ['オーランド・ブルーム様', 'ひろき様'],
    appearance: '180㎝くらい',
    updated_at: '2025-12-13',
    bottles: [
      { brand: 'チャミスル', number: 25, remaining: 0.2, status: 'active' },
    ],
    staff: [{ name: 'あい', role: '指名', is_current: true }],
  },
]

// ============================================================
// メイン処理
// ============================================================
async function seed() {
  console.log('🌱 Seeding started...\n')

  // 1. スタッフの挿入
  console.log('👤 Inserting staff...')
  const staffIdMap: Record<string, number> = {}
  for (const s of STAFF) {
    const rows = await sql`
      INSERT INTO core.staff (name, is_active)
      VALUES (${s.name}, ${s.is_active})
      ON CONFLICT (name) DO UPDATE SET is_active = EXCLUDED.is_active
      RETURNING id, name
    `
    staffIdMap[rows[0].name as string] = rows[0].id as number
    console.log(`  ✓ ${s.name} (id: ${rows[0].id})`)
  }

  // 2. 顧客・ボトル・customer_staff の挿入
  console.log('\n🍾 Inserting customers & bottles...')
  for (const c of CUSTOMERS) {
    // 顧客挿入
    const custRows = await sql`
      INSERT INTO core.customers
        (name, aliases, tag, company, appearance, location, note, updated_at, created_at)
      VALUES
        (${c.name}, ${c.aliases}, ${c.tag ?? null}, ${c.company ?? null},
         ${c.appearance ?? null}, ${c.location ?? null}, ${c.note ?? null},
         ${c.updated_at}::date, ${c.updated_at}::date)
      ON CONFLICT DO NOTHING
      RETURNING id
    `

    // ON CONFLICT DO NOTHING では id が返らない場合があるので SELECT で補完
    let customerId: number
    if (custRows.length > 0) {
      customerId = custRows[0].id as number
    } else {
      const existing = await sql`SELECT id FROM core.customers WHERE name = ${c.name} LIMIT 1`
      customerId = existing[0].id as number
    }

    // ボトル挿入
    for (const b of c.bottles) {
      await sql`
        INSERT INTO bottle.bottles
          (customer_id, brand, number, remaining, status, bottle_tag, location, registered_at)
        VALUES
          (${customerId}, ${b.brand}, ${b.number ?? null}, ${b.remaining ?? null},
           ${b.status}, ${b.bottle_tag ?? null}, ${b.location ?? null},
           ${c.updated_at}::date)
      `
    }

    // customer_staff リンク
    for (const cs of c.staff) {
      const staffId = staffIdMap[cs.name]
      if (!staffId) { console.warn(`  ⚠ staff not found: ${cs.name}`); continue }
      await sql`
        INSERT INTO bottle.customer_staff (customer_id, staff_id, role, is_current)
        VALUES (${customerId}, ${staffId}, ${cs.role}, ${cs.is_current})
        ON CONFLICT (customer_id, staff_id, role) DO UPDATE SET is_current = EXCLUDED.is_current
      `
    }

    const activeCount = c.bottles.filter(b => b.status === 'active').length
    console.log(`  ✓ ${c.name}（ボトル ${activeCount}本 active）`)
  }

  // 3. 集計
  const [custCount] = await sql`SELECT count(*) FROM core.customers`
  const [bottleCount] = await sql`SELECT count(*) FROM bottle.bottles WHERE status = 'active'`
  const [csCount] = await sql`SELECT count(*) FROM bottle.customer_staff`

  console.log('\n✅ Seed complete!')
  console.log(`   顧客: ${custCount.count}件`)
  console.log(`   ボトル(active): ${bottleCount.count}本`)
  console.log(`   指名関係: ${csCount.count}件`)
}

seed().catch(e => { console.error(e); process.exit(1) })
