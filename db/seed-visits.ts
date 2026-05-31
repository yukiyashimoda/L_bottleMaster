import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_rioMwOgj3N0Q@ep-round-bread-am892xho.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require'
const sql = neon(DATABASE_URL)

// ============================================================
// 来店履歴に登場する新規キャスト（既存10名に追加）
// ============================================================
const NEW_CASTS = [
  'ゆうな','みこと','ひまり','みほ','かお','みすず','あざみ',
  'ななみ','りおん','かりん','みり','ちなみ','あやな','りり',
  'ゆら','らら','えみ','のぞみ','ゆう','りょう','まりか','れん',
  'かおり','まりん','めい','るり','るる','かい','れい','もな',
]

// ============================================================
// 来店履歴データ
// 形式: { date, memo, inStoreCasts }
// ============================================================
type V = { date: string; memo: string; inStoreCasts: string[] }

const VISITS: Record<string, V[]> = {
  '山岸': [
    { date: '2026-04-24', memo: 'ゆうな場内',                              inStoreCasts: ['ゆうな'] },
    { date: '2026-05-22', memo: 'みこと場内',                              inStoreCasts: ['みこと'] },
    { date: '2026-05-23', memo: '苗村さんと来店',                          inStoreCasts: [] },
    { date: '2025-03-01', memo: 'あい指名 ひまり場内',                     inStoreCasts: ['ひまり'] },
    { date: '2025-03-29', memo: 'ひまり指名 みほ場内',                     inStoreCasts: ['みほ'] },
    { date: '2025-07-11', memo: 'ひまり・かい休み かお・みすず場内',       inStoreCasts: ['かお','みすず'] },
    { date: '2025-08-02', memo: 'ひまり休みで来店 あざみ場内',             inStoreCasts: ['あざみ'] },
    { date: '2025-11-15', memo: 'ななみ場内',                              inStoreCasts: ['ななみ'] },
    { date: '2025-12-06', memo: 'あい指名と来店 りおん場内',               inStoreCasts: ['りおん'] },
    { date: '2025-12-13', memo: 'あい指名と来店 かりん場内',               inStoreCasts: ['かりん'] },
  ],
  '佐藤恵一': [
    { date: '2026-02-28', memo: '白樫さんと来店 かりん場内',               inStoreCasts: ['かりん'] },
    { date: '2026-03-19', memo: 'みり場内',                                inStoreCasts: ['みり'] },
    { date: '2026-04-04', memo: 'みこと場内',                              inStoreCasts: ['みこと'] },
    { date: '2026-05-16', memo: 'ちなみ場内',                              inStoreCasts: ['ちなみ'] },
    { date: '2025-04-19', memo: '来店',                                    inStoreCasts: [] },
    { date: '2025-11-15', memo: 'あやな場内',                              inStoreCasts: ['あやな'] },
    { date: '2025-11-21', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-11-29', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-12-06', memo: '白樫さんの席に追加 あんな場内',           inStoreCasts: ['あんな'] },
    { date: '2025-12-13', memo: '白樫さんと来店 りり指名林田さんの席に追加 あんな場内', inStoreCasts: ['あんな'] },
    { date: '2025-12-19', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-12-25', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-12-27', memo: 'あんな場内（取り忘れ）',                  inStoreCasts: ['あんな'] },
  ],
  '山内': [
    { date: '2025-04-02', memo: 'あい指名 ゆら・らら場内',                 inStoreCasts: ['ゆら','らら'] },
    { date: '2025-11-05', memo: 'りこ場内',                                inStoreCasts: ['りこ'] },
    { date: '2026-05-19', memo: 'るり場内',                                inStoreCasts: ['るり'] },
  ],
  '池田・はんだ': [
    { date: '2025-05-07', memo: '池田様来店 あい本指 えみ場内',            inStoreCasts: ['えみ'] },
    { date: '2025-08-21', memo: 'すみれ指名 半田さん来店',                 inStoreCasts: [] },
    { date: '2025-10-14', memo: '半田さん来店',                            inStoreCasts: [] },
    { date: '2026-05-08', memo: '池田さん来店 あんな場内',                 inStoreCasts: ['あんな'] },
  ],
  '金子': [
    { date: '2025-10-01', memo: 'らら場内',                                inStoreCasts: ['らら'] },
    { date: '2026-02-16', memo: 'らら休みで来店 ななみ場内',               inStoreCasts: ['ななみ'] },
    { date: '2026-02-17', memo: 'まりか場内',                              inStoreCasts: ['まりか'] },
  ],
  'いの': [
    { date: '2026-01-30', memo: 'りょう場内',                              inStoreCasts: ['りょう'] },
    { date: '2026-01-31', memo: 'りょう・あんな場内',                      inStoreCasts: ['りょう','あんな'] },
    { date: '2025-05-23', memo: 'まりか場内',                              inStoreCasts: ['まりか'] },
    { date: '2025-06-14', memo: 'れん場内',                                inStoreCasts: ['れん'] },
    { date: '2025-06-16', memo: 'いのさん体調不良で来店 ボトルは出さず',   inStoreCasts: [] },
    { date: '2025-07-03', memo: 'いのさん来店 ボトル出さず',               inStoreCasts: [] },
    { date: '2025-07-11', memo: 'えみ場内',                                inStoreCasts: ['えみ'] },
    { date: '2025-09-18', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-10-17', memo: 'あんな・のぞみ場内',                      inStoreCasts: ['あんな','のぞみ'] },
    { date: '2025-11-06', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-11-22', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-11-26', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-11-27', memo: '女性の人と来店 あやな場内',               inStoreCasts: ['あやな'] },
    { date: '2025-12-08', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-12-19', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-12-24', memo: 'あんな・ゆう場内',                        inStoreCasts: ['あんな','ゆう'] },
    { date: '2025-12-25', memo: 'みすず場内',                              inStoreCasts: ['みすず'] },
    { date: '2025-12-26', memo: 'みすず・あんな場内',                      inStoreCasts: ['みすず','あんな'] },
  ],
  '龍ちゃん': [
    { date: '2026-01-30', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-03-22', memo: 'あい指名 みこと場内',                     inStoreCasts: ['みこと'] },
    { date: '2025-05-10', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-05-28', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-09-17', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-10-15', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-11-21', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-11-26', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-12-06', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-12-12', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
    { date: '2025-12-20', memo: 'お連れと来店 ボトルは出さず',             inStoreCasts: [] },
    { date: '2025-12-22', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
  ],
  '北島': [
    { date: '2025-12-11', memo: '魔女ゆず×1・パインボトル×1キープ',       inStoreCasts: [] },
  ],
  '高畠': [
    { date: '2025-06-28', memo: 'あい指名 たくやさん来店',                 inStoreCasts: [] },
    { date: '2025-10-24', memo: 'あい指名 山藤さん来店',                   inStoreCasts: [] },
  ],
  'はじめ': [
    { date: '2025-08-05', memo: 'あい休みで来店',                          inStoreCasts: [] },
    { date: '2026-01-17', memo: 'めい場内',                                inStoreCasts: ['めい'] },
  ],
  '入江': [
    { date: '2025-04-12', memo: 'あい・かい指名（連れがかい指名）',        inStoreCasts: [] },
    { date: '2025-12-22', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
  ],
  'ひでちまる': [
    { date: '2025-12-12', memo: 'ひまり・あんな場内',                      inStoreCasts: ['ひまり','あんな'] },
  ],
  '吉田': [
    { date: '2025-12-17', memo: 'あいから言われてボトル流れた対応でまた知多入った あんな場内', inStoreCasts: ['あんな'] },
  ],
  '横山': [
    { date: '2025-04-08', memo: 'めぐみ指名 まりん場内',                   inStoreCasts: ['まりん'] },
    { date: '2025-06-26', memo: '横山さん来店 かおり場内',                 inStoreCasts: ['かおり'] },
    { date: '2025-07-01', memo: '横山さんと来店 みほ場内',                 inStoreCasts: ['みほ'] },
    { date: '2025-08-26', memo: '横山さん来店 めぐみ休み',                 inStoreCasts: [] },
    { date: '2025-11-27', memo: '横山さん来店',                            inStoreCasts: [] },
    { date: '2025-12-15', memo: '石崎さん来店 めい・みこと場内',           inStoreCasts: ['めい','みこと'] },
  ],
  '村山': [
    { date: '2025-09-20', memo: 'みこと場内',                              inStoreCasts: ['みこと'] },
    { date: '2025-10-25', memo: '大槻さんと来店 あやな場内',               inStoreCasts: ['あやな'] },
    { date: '2025-11-08', memo: '大槻さんと来店',                          inStoreCasts: [] },
    { date: '2025-12-13', memo: '大槻さんと来店',                          inStoreCasts: [] },
  ],
  '黒沢': [
    { date: '2025-09-29', memo: 'みこと・るる場内',                        inStoreCasts: ['みこと','るる'] },
    { date: '2025-10-22', memo: 'かおり場内',                              inStoreCasts: ['かおり'] },
  ],
  '天野': [
    { date: '2025-10-02', memo: 'あんな場内',                              inStoreCasts: ['あんな'] },
  ],
  '新田': [
    { date: '2025-01-17', memo: 'あい指名 めぐみ場内',                     inStoreCasts: ['めぐみ'] },
    { date: '2025-02-12', memo: 'めい・あい指名',                          inStoreCasts: ['めい'] },
    { date: '2025-06-10', memo: 'さち場内',                                inStoreCasts: ['さち'] },
    { date: '2025-06-16', memo: 'めい指名と来店',                          inStoreCasts: [] },
  ],
  '十勝とおる': [
    { date: '2025-06-26', memo: 'パーティーで来店 れい場内',               inStoreCasts: ['れい'] },
  ],
  '藤田': [
    { date: '2025-04-30', memo: 'お連れ かおり・もな場内',                 inStoreCasts: ['かおり','もな'] },
  ],
}

// ============================================================
// メイン処理
// ============================================================
async function seed() {
  console.log('🌱 来店履歴 seed 開始...\n')

  // 1. 既存キャスト名→IDマップを作成
  const castRows = await sql`SELECT id, name FROM public.casts`
  const castMap: Record<string, string> = {}
  for (const r of castRows) castMap[r.name as string] = r.id as string

  // 2. 新規キャストを追加
  console.log('👤 新規キャスト追加...')
  for (const name of NEW_CASTS) {
    if (castMap[name]) continue
    const id = `cast-${Date.now()}-${Math.random().toString(36).slice(2,6)}`
    await sql`
      INSERT INTO public.casts (id, name, ruby, memo, updated_at, updated_by)
      VALUES (${id}, ${name}, ${name}, '', ${new Date().toISOString()}, '')
      ON CONFLICT (id) DO NOTHING
    `
    // core.staff にも追加（is_active=false で履歴用）
    await sql`
      INSERT INTO core.staff (name, is_active)
      VALUES (${name}, false)
      ON CONFLICT (name) DO NOTHING
    `
    castMap[name] = id
    console.log(`  + ${name} (${id})`)
  }

  // 更新後のマップを再取得
  const freshCasts = await sql`SELECT id, name FROM public.casts`
  for (const r of freshCasts) castMap[r.name as string] = r.id as string

  // 3. 顧客ID マップ作成
  const custRows = await sql`SELECT id, name FROM public.customers`
  const custMap: Record<string, string> = {}
  for (const r of custRows) custMap[r.name as string] = r.id as string

  // 4. 来店履歴挿入
  console.log('\n📅 来店履歴挿入...')
  let total = 0

  for (const [customerName, visits] of Object.entries(VISITS)) {
    const customerId = custMap[customerName]
    if (!customerId) {
      console.warn(`  ⚠ 顧客が見つからない: ${customerName}`)
      continue
    }

    // 既存の指名キャストを取得
    const custData = await sql`
      SELECT designated_cast_ids FROM public.customers WHERE id = ${customerId}
    `
    const designatedCastIds = (custData[0]?.designated_cast_ids as string[]) ?? []

    let inserted = 0
    for (const v of visits) {
      // 重複チェック
      const exists = await sql`
        SELECT id FROM public.visit_records
        WHERE customer_id = ${customerId} AND visit_date = ${v.date}
        LIMIT 1
      `
      if (exists.length > 0) continue

      const inStoreCastIds = v.inStoreCasts
        .map(name => castMap[name])
        .filter(Boolean)

      const id = `${Date.now()}-${Math.random().toString(36).slice(2,9)}`
      await sql`
        INSERT INTO public.visit_records
          (id, customer_id, visit_date, designated_cast_ids, in_store_cast_ids,
           bottles_opened, bottles_used, memo, is_alert, alert_reason, bottle_snapshots)
        VALUES
          (${id}, ${customerId}, ${v.date}, ${designatedCastIds}, ${inStoreCastIds},
           '{}', '{}', ${v.memo}, false, '', '[]'::jsonb)
      `
      inserted++
      total++
    }

    if (inserted > 0) console.log(`  ✓ ${customerName}: ${inserted}件`)
  }

  // 5. 最終集計
  const [vCount] = await sql`SELECT COUNT(*) FROM public.visit_records`
  const [cCount] = await sql`SELECT COUNT(*) FROM public.casts`
  console.log(`\n✅ 完了!`)
  console.log(`   来店履歴合計: ${vCount.count}件（今回追加: ${total}件）`)
  console.log(`   キャスト合計: ${cCount.count}名`)
}

seed().catch(e => { console.error(e); process.exit(1) })
