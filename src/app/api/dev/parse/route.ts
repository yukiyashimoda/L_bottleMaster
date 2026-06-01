import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const SYSTEM_PROMPT = `あなたはナイトクラブのボトルキープ管理データを解析するAIです。
テキストから顧客データを抽出し、JSON配列で返してください。JSONのみ返し、説明文は不要です。

## 令和→西暦変換
R1=2019, R2=2020, R3=2021, R4=2022, R5=2023, R6=2024, R7=2025, R8=2026
例: "R7 3/15" → "2025-03-15"、"R8 1/5" → "2026-01-05"

## ルール
- ❏ で始まる行が顧客エントリ、字下げ❏はサブメモ
- 名前: 漢字/カタカナ表記を主要名(name)にし、他の呼び方はaliasesに
- タグ(タグ:xxx): tags 配列に（複数可）
- ボトル番号: 「チャミスル55」→ brand:"チャミスル", number:55
  ただし商品名に含まれる数字は番号ではない: ハーパー8y, 白州12y, 山崎12y, バランタイン12y/17y, シーバス12y/18y, ラフロイグ10y, ミズナラ12y 等
- 残量: 括弧内の小数 (残量0.7) → remaining:"70%" のように整数%付き文字列に変換
- 「飲み切り」「飲みきり」= status:"finished", remaining:"0%"
- キャスト名（指名/場内）: ボトル情報の後に記載。「元xxx」「元xxx指名」は元指名(is_current:false)
- 保管場所: 「棚5」「カウンター棚F」「調律棚置き」等
- 「お連れ」「連れ」はnoteに含める

## JSON形式
[
  {
    "name": "主要名",
    "aliases": ["別名1", "別名2"],
    "tags": [],
    "company": null,
    "appearance": null,
    "location": null,
    "note": null,
    "updated_at": "YYYY-MM-DD",
    "bottles": [
      {
        "brand": "ブランド名",
        "number": null,
        "remaining": "70%",
        "status": "active",
        "location": null,
        "bottle_tag": null
      }
    ],
    "staff": [
      { "name": "キャスト名", "role": "指名", "is_current": true }
    ]
  }
]`

export async function POST(req: NextRequest) {
  const { text } = await req.json() as { text: string }
  if (!text?.trim()) return NextResponse.json({ error: 'テキストが空です' }, { status: 400 })

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  })

  const result = await model.generateContent(text)
  const raw = result.response.text().trim()
  const jsonStr = raw.startsWith('```') ? raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '') : raw

  try {
    const customers = JSON.parse(jsonStr)
    return NextResponse.json({ customers })
  } catch {
    return NextResponse.json({ error: 'パース失敗', raw }, { status: 422 })
  }
}
