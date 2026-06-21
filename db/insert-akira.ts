import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createBottle, createCast, createCustomer, deleteBottle, getBottlesByCustomer, getCasts, getCustomers, updateCustomer } from '../src/lib/kv'

type ParsedBottle = {
  name: string
  remaining: string
  status: 'active' | 'finished'
}

type ParsedCustomer = {
  name: string
  memo: string
  lastVisitDate: string | null
  bottles: ParsedBottle[]
}

function loadEnv(): void {
  if (process.env.DATABASE_URL) return
  const envPath = resolve(process.cwd(), '.env.local')
  const content = readFileSync(envPath, 'utf8')
  const line = content.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='))
  if (!line) throw new Error('DATABASE_URL not found in .env.local')
  process.env.DATABASE_URL = line.split('=')[1].replace(/^"|"$/g, '')
}

function toRemaining(value: string | number): string {
  const raw = typeof value === 'number' ? value : Number(String(value).replace('%', '').trim())
  if (Number.isNaN(raw)) return '100%'
  const percent = raw <= 1 ? raw * 100 : raw
  return `${Math.round(percent)}%`
}

function parseEraDate(text: string): string | null {
  const m = text.match(/R([1-9]\d?)\s*[ 　]*([0-9]{1,2})\/([0-9]{1,2})/)
  if (!m) return null
  const era = Number(m[1])
  const year = 2018 + era
  const month = Number(m[2])
  const day = Number(m[3])
  if (!year || !month || !day) return null
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

function latestDate(text: string): string | null {
  const matches = [...text.matchAll(/R([1-9]\d?)\s*[ 　]*([0-9]{1,2})\/([0-9]{1,2})/g)]
  if (matches.length === 0) return null
  const dates = matches
    .map((m) => parseEraDate(m[0]))
    .filter((d): d is string => !!d)
  if (dates.length === 0) return null
  return dates.sort().at(-1) ?? null
}

function splitHeader(header: string): { name: string; inlineTail: string } {
  const trimmed = header.trim()
  const marker = trimmed.search(/(?:タグ[:：]|R[1-9]\d?\s*[ 　]*\d{1,2}\/\d{1,2}|[（(]残量|飲み切り|飲みきり)/)
  if (marker > 0) {
    return {
      name: trimmed.slice(0, marker).replace(/[ 　]+$/, ''),
      inlineTail: trimmed.slice(marker).trim(),
    }
  }
  const slash = trimmed.match(/^(.+?様)[ 　]+(.+)$/)
  if (slash) {
    const rest = slash[2]
    if (/[（(]残量|飲み切り|飲みきり|R[1-9]\d?\s*[ 　]*\d{1,2}\/\d{1,2}|タグ[:：]/.test(rest)) {
      return { name: slash[1], inlineTail: rest.trim() }
    }
  }
  return { name: trimmed, inlineTail: '' }
}

function parseBottles(text: string): ParsedBottle[] {
  const bottles: ParsedBottle[] = []
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    const cleaned = line.replace(/^\s*[・•]/, '').trim()
    if (!cleaned) continue
    const seen = new Set<string>()

    const remainingMatches = [...cleaned.matchAll(/([^\s　()（）]+)\s*[（(]残量\s*([0-9.、,]+)\s*[)）]/g)]
    for (const m of remainingMatches) {
      const name = m[1].trim()
      for (const part of m[2].split(/[、,]/).map((s) => s.trim()).filter(Boolean)) {
        const remaining = toRemaining(Number(part))
        const status = remaining === '0%' ? 'finished' : 'active'
        const key = `${name}|${remaining}|${status}`
        if (seen.has(key)) continue
        seen.add(key)
        bottles.push({ name, remaining, status })
      }
    }

    const finishedMatches = [...cleaned.matchAll(/([^\s　()（）]+)\s*(?:飲み切り|飲みきり)/g)]
    for (const m of finishedMatches) {
      const name = m[1].trim()
      const key = `${name}|0%|finished`
      if (seen.has(key)) continue
      seen.add(key)
      bottles.push({ name, remaining: '0%', status: 'finished' })
    }

    if (bottles.length === 0 && /[（(]残量|飲み切り|飲みきり/.test(cleaned)) {
      const fallback = cleaned.replace(/[（(]残量\s*[0-9.]+\s*[)）]/g, '').trim()
      if (fallback && !seen.has(fallback)) {
        bottles.push({ name: fallback, remaining: '100%', status: 'active' })
      }
    }
  }
  return bottles
}

function parseMemo(text: string): string {
  const lines = text.split(/\r?\n/)
  const notes: string[] = []
  for (const line of lines) {
    const cleaned = line.replace(/^\s*[・•]/, '').trim()
    if (!cleaned) continue
    const stripped = cleaned
      .replace(/([^\s　()（）]+)\s*[（(]残量\s*[0-9.]+\s*[)）]/g, '')
      .replace(/([^\s　()（）]+)\s*(?:飲み切り|飲みきり)/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!stripped) continue
    if (/[（(]残量|飲み切り|飲みきり/.test(cleaned) && !/[A-Za-zぁ-んァ-ン一-龥]/.test(stripped)) continue
    notes.push(cleaned)
  }
  return notes.join('\n').trim()
}

function parseRaw(raw: string): ParsedCustomer[] {
  const customers: ParsedCustomer[] = []
  const lines = raw.replace(/\r/g, '').split('\n')
  let current: { header: string; body: string[] } | null = null

  for (const line of lines) {
    const trimmed = line.trimEnd()
    if (/^▶︎/.test(trimmed)) {
      if (current) customers.push(buildCustomer(current.header, current.body))
      current = { header: trimmed.replace(/^▶︎\s*/, ''), body: [] }
      continue
    }
    if (!current) continue
    current.body.push(trimmed)
  }

  if (current) customers.push(buildCustomer(current.header, current.body))
  return customers.filter((c) => c.name.trim().length > 0)
}

function buildCustomer(header: string, body: string[]): ParsedCustomer {
  const { name, inlineTail } = splitHeader(header)
  const bodyText = [inlineTail, ...body].filter(Boolean).join('\n')
  const lastVisitDate = latestDate([header, ...body].join('\n'))
  const bottles = parseBottles(bodyText)
  const memo = parseMemo(bodyText)
  return { name: name.trim(), memo, lastVisitDate, bottles }
}

async function run() {
  loadEnv()

  const raw = String.raw`■あきら

▶︎ 五十嵐様
角サン53(残量0.6)
R8　5/30えま、まゆ、なつき場内
 
▶︎中村様　角サン48(残量0.5)
R8　5/22

▶︎あきラブ様　
・ひえぬき様　ひー様　
ローヤル21（残量0.8）
R8 4/21

北電ユニオンの会長

▶︎乾様　
タグ:JAｵﾎｰﾂｸ網走様　
お偉い様用 いいちこ黒（残量0.2）ｼｰﾊﾞｽ12y旧6（残量0.2）  　
R8　4/15
基本的に予定上がったらあきらさんからどっち出すか言われたら用意してボトル出す
カウンター棚2にボトルある
R8　4/15すい場内

▶︎田中様　
タグ:こうちゃん　
ローヤル(残量0.5)　
R8　2/20

▶︎ダイハツ工業様（藤原・川村様） 
竹鶴PM26　(残量0)　　知多49　(残量0.9) 
R7　12/15
吉四六41飲みきり、山崎sm27飲みきり
あきら指名藤原さんのバラン12y別にあるのでそれも一緒に出す。
R7　8/2
あきら指名鈴木さんの席であきらさんから言われてボトル出した。
12/15
1万ドリンク別パーティーで来店まや、めい、ひまり場内ボトルは出さず

▶︎石川孝彦様 
ｼﾞｬｯｸﾀﾞﾆｴﾙ　(残量0.6)  
三井不動産ﾚｼﾞﾃﾞﾝｼｬﾙｻｰﾋﾞｽ北海道㈱

▶︎板垣様　
タグ:JAオホーツク網走 青年部様
社員様用 ジャックダニエル25　（残量0.2、1.0）
必ず1本のみ出す 　 
R7 　4/21
カウンター棚2
予定上がってあきらさんからどっち出すか言ってもらってからボトル出す

▶︎藤原様 竹鶴PM26　ﾊﾞﾗﾝﾀｲﾝ12y30　(残量0.2) 
ﾀﾞｲﾊﾂ北海道販売㈱　　
ﾀﾞｲﾊﾂ工業様の藤原様のときはこっち（竹鶴は共有） 
R6　5/15
あきら指名川村さん来店したら一緒に出す。

▶︎田中様 
百姓一揆　(残量0.3) 
カウンター棚Aにボトルある

▶︎高松様　
ハーパーGM18（残量0.9）

▶︎横山様（ﾉｯｸ様） 
ﾊｰﾊﾟｰGM11　(残量0.01)
R5　9/11

▶︎松村様 
山崎SM3　(残量0.8) 

▶︎木村様　 
響BC　(残量0.8) 
お坊さん

▶︎松尾様 
黒霧島25　(残量0.1) 
桜木あきら  R3　12/24

▶︎古川・松川様 
ｼｰﾊﾞｽ12y5　(残量0.4) 

▶︎布施川博之様 
ﾊﾞﾗﾝﾀｲﾝ17y14　(残量0.1)　百姓一揆　(残量0.5) 
㈱ｷｭｰｿｰ流通ｼｽﾃﾑ　

▶︎藤本礼様 
山崎SM26　(残量0.01)
 ㈱ﾕｰｹｰﾄﾗﾝｽﾎﾟｰﾄ　

▶︎林出様 
黒霧島19　(残量0.4) 
三井設備㈱

▶︎林様 
山崎12y6　(残量0.6)　百姓一揆　(残量0.5)  百姓一揆(残量0.3)
カウンター棚Aにボトルある
 百姓一揆に山崎12yのタグ掛けて保管

▶︎西山様 
竹鶴ﾋﾟｭｱﾓﾙﾄ16　(残量0.6) 

▶︎中山・西村様 
ﾛﾊﾞｰﾄﾌﾞﾗｳﾝ　(残量0.7)
 鍛高梅棚置き

▶︎長井様（殿） 
知多2　(残量0.8) 
R3　4/3

▶︎高村様 
吉四六43　(残量0.8) 

▶︎品田様 
竹鶴ﾋﾟｭｱﾓﾙﾄ40　(残量0.6)

▶︎栗田様 
竹鶴ﾋﾟｭｱﾓﾙﾄ旧37　
(残量0.6) あきら

▶︎工藤様
マッカラン12y9　（残量0.7）
R4　1/6

▶︎神田様
いいちこ黒　(残量0.5)
(有)神田重機工業　
カウンター棚Aにボトルある

▶︎ 川村様　かわむら
吉四六飲み切り
ﾀﾞｲﾊﾂ北海道販売㈱　 
R5　1/12

▶︎金岡様
百姓一揆　(残量0.2)
マッカラン12y18（残量0.3）
バカラグラス有 　R5　8/5
バカラグラスカウンター前棚の二段目の白いかごにある
百姓一揆にマッカラン12yのタグ掛けて保管。　カウンター棚Aにボトルある

▶︎ 大倉様
酔月　(残量0.8)

▶︎大岡様　宮津様 
ﾏｯｶﾗﾝ12yDC　飲み切り
ｿﾆｰ生命保険

▶︎ 大石様
ｼﾞｬｯｸﾀﾞﾆｴﾙ17　(残量0.8)
ｲｳﾞｼｭｰﾙ　

▶︎ ｴｸｼﾝｸﾞ様（前原・最上様）
黒霧島15　(残量0.2)

▶︎稲垣様
ｼﾞｬｯｸﾀﾞﾆｴﾙ30　(残量0.9)

▶︎泉様
鏡月　飲み切り

▶︎ 誠一門様
北電ﾕﾆｵﾝ
角ｻﾝ76　(残量0.8) 
あきら　あすか
伊豆様がいるときは出さない
ﾛｰﾔﾙ4　飲み切り
R6　1/18

▶︎水下様
ｼｰﾊﾞｽ18y　(残量0.8) 
R6　2/13

▶︎きみちゃん様
ｼﾞｮﾆｰｳｫｰｶｰ黒　(残量0.8)
もな 中村幸太様（かれん）お連れ様
R5　12/22

▶︎しげちゃん様
ﾅｶﾞｻﾜ
鍛高譚しそ1　 (残量0.2) あきら  せいら
R4　12/16

▶︎山本様
鹿島建設
赤霧島23（残量0.8）
V1入店
 R6　8/29

▶︎ﾄﾑｸﾙｰｽﾞ様
引谷？様　ひきたに様
ｼｰﾊﾞｽ12y63　(残量0.9)
R6　8/2

▶︎番井様
ｼﾞｮﾆｰｳｫｰｶｰ25 (残量0.9)
R5　8/5

▶︎田村工業様
ローヤル27（残量0）
空き瓶有
R6　1/18

▶︎ 新様　
しん 
角ｻﾝ111　(残量0.8) 
郡司ついた
R6　1/31

▶︎合田様
竹鶴PM24　(残量0.8)
R6　3/27

▶︎北村様
ﾍﾈｼｰVSOP　(残量0.7)
R6　3/30
カウンター棚Aにボトルある

▶︎ 大森様　小川様
山崎12y 12 (残量0.3)
R5　10/19

▶︎池ちゃん　
ゆみちゃん 
ﾊﾞﾗﾝﾀｲﾝ12y34　(残量0.8)
R5　9/23

▶︎TMP様
竹鶴PM6（残量0.2）
SV2団体　
竹鶴ﾋﾟｭｱﾓﾙﾄ調律置き（少ないため） 
R5　8/26

▶︎NICHIJO　資材部様
さかた　にちじょう 
ｼｰﾊﾞｽ12y新48　(残量0.1)
R5　7/22

▶︎坂本様
知多38　(残量0.8)
まや　元あきら？　 お連れ様　みか場内 
R5　10/23

▶︎大塚様　
上村様 
ｼｰﾊﾞｽ12ｙ新26　(残量0.5) 
あきら　りんな 大きいカメラ忘れた人 
R4　9/1

▶︎堂守様 
ﾒｰｶｰｽﾞﾏｰｸ　(残量0.7) 
R5　4/20`

  const parsed = parseRaw(raw)
  const existingCast = (await getCasts()).find((c) => c.name === 'あきら')
  let akiraCastId = existingCast?.id ?? ''
  if (!akiraCastId) {
    const created = await createCast({ name: 'あきら', ruby: 'あきら', memo: '', updatedBy: 'akira-import' })
    akiraCastId = created.id
  }
  if (!akiraCastId) throw new Error('cast あきら を作成できませんでした')

  const customerMap = new Map((await getCustomers()).map((c) => [c.name, c]))
  let inserted = 0
  let updated = 0

  for (const item of parsed) {
    const existing = customerMap.get(item.name)
    const payload = {
      name: item.name,
      ruby: item.name,
      nickname: '',
      designatedCastIds: [akiraCastId],
      isAlert: false,
      alertReason: '',
      memo: item.memo,
      linkedCustomerIds: [],
      isFavorite: false,
      hasGlass: false,
      glassMemo: '',
      receiptNames: [],
      lastVisitDate: item.lastVisitDate,
      updatedBy: 'akira-import',
    }

    let customerId = existing?.id ?? ''
    if (existing) {
      const result = await updateCustomer(existing.id, payload)
      if (!result) throw new Error(`顧客更新失敗: ${item.name}`)
      updated += 1
      customerId = result.id
    } else {
      const result = await createCustomer(payload)
      customerId = result.id
      inserted += 1
    }

    const existingBottles = await getBottlesByCustomer(customerId)
    for (const b of existingBottles) {
      await deleteBottle(b.id)
    }

    for (const b of item.bottles) {
      await createBottle({
        customerId,
        name: b.name,
        remaining: b.remaining,
        openedDate: item.lastVisitDate ?? new Date().toISOString().slice(0, 10),
      })
    }
  }

  console.log(`imported: ${inserted}, updated: ${updated}, total: ${parsed.length}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
