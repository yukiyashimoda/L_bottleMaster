import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { neon } from '@neondatabase/serverless'

function loadEnv(): string {
  const envPath = resolve(process.cwd(), '.env.local')
  const content = readFileSync(envPath, 'utf8')
  const line = content.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='))
  if (!line) throw new Error('DATABASE_URL not found in .env.local')
  return line.split('=')[1].replace(/^"|"$/g, '')
}

function toHiragana(text: string): string {
  return text.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
}

function normalizeKey(name: string): string {
  return name
    .trim()
    .replace(/[ 　]+/g, ' ')
    .replace(/[（(].*?[)）]/g, '')
    .replace(/(?:様|さん|君|殿|会長)$/g, '')
    .replace(/[・･]/g, ' ')
    .trim()
}

const MANUAL: Record<string, string> = {
  いの: 'いの',
  たけし: 'たけし',
  はじめ: 'はじめ',
  ひでちまる: 'ひでちまる',
  ひやまばし: 'ひやまばし',
  ひろき: 'ひろき',
  まき: 'まき',
  やすし: 'やすし',
  よしろう: 'よしろう',
  わたなべ: 'わたなべ',
  伊豆: 'いず',
  佐々木: 'ささき',
  佐藤恵一: 'さとう けいいち',
  入江: 'いりえ',
  北島: 'きたじま',
  北村: 'きたむら',
  十勝とおる: 'とかち とおる',
  吉本: 'よしもと',
  吉田: 'よしだ',
  天野: 'あまの',
  小松: 'こまつ',
  山内: 'やまうち',
  山口: 'やまぐち',
  山岸: 'やまぎし',
  山崎: 'やまざき',
  山藤たくや: 'やまふじ たくや',
  岡本博: 'おかもと ひろし',
  '岡本 博': 'おかもと ひろし',
  岡本: 'おかもと',
  川上: 'かわかみ',
  幌内2号定置: 'ほろない2ごうていち',
  新田: 'にった',
  早川: 'はやかわ',
  朝岡: 'あさおか',
  村山: 'むらやま',
  横山: 'よこやま',
  横田: 'よこた',
  武藤矢口: 'むとう やぐち',
  '池田 はんだ': 'いけだ はんだ',
  泉隆: 'いずみ たかし',
  畑野: 'はたの',
  畠山京助: 'はたけやま きょうすけ',
  菊池: 'きくち',
  藤田: 'ふじた',
  野澤: 'のざわ',
  金子: 'かねこ',
  鈴木直良: 'すずき なおよし',
  雄武漁連: 'おうむぎょれん',
  雄武鮭定置部: 'おうむさけていちぶ',
  須川: 'すがわ',
  高畠: 'たかばたけ',
  高石広一: 'たかいし こういち',
  黒沢: 'くろさわ',
  龍ちゃん: 'りゅうちゃん',
  まき会長: 'まき',
  武藤: 'むとう',
  横田様: 'よこた',
  佐々木様: 'ささき',
  小松様: 'こまつ',
  山崎様: 'やまざき',
  川上様: 'かわかみ',
  朝岡様: 'あさおか',
  泉隆様: 'いずみ たかし',
  畑野様: 'はたの',
  須川様: 'すがわ',
  伊豆様: 'いず',
  北村: 'きたむら',
  佐藤: 'さとう',
  '武藤 矢口': 'むとう やぐち',
  幌内2号定置様: 'ほろない2ごうていち',
  鈴木直良様: 'すずき なおよし',
  雄武漁連様: 'おうむぎょれん',
  雄武鮭定置部R6: 'おうむさけていちぶ',
}

function guessRuby(name: string): string {
  const key = normalizeKey(name)
  if (MANUAL[key]) return MANUAL[key]
  const kanaLike = toHiragana(key)
  if (/^[ぁ-ゖー 0-9]+$/.test(kanaLike)) return kanaLike.trim()
  return key
}

async function main() {
  const sql = neon(loadEnv())
  const rows = await sql`
    SELECT c.id, c.name, c.ruby
    FROM customers c
    JOIN customer_store_profiles p ON p.customer_id = c.id
    WHERE p.store_id = 'store-main'
      AND COALESCE(c.ruby, '') = ''
    ORDER BY c.name
  `

  let updated = 0
  for (const row of rows) {
    const ruby = guessRuby(String(row.name))
    await sql`
      UPDATE customers
      SET ruby = ${ruby}
      WHERE id = ${row.id}
    `
    updated += 1
    console.log(`${row.name} -> ${ruby}`)
  }

  console.log(`updated: ${updated}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
