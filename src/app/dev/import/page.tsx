'use client'
import { useState, useEffect } from 'react'

type Bottle = {
  brand: string; number?: number | null; remaining?: number | null
  status: 'active' | 'finished'; location?: string | null; bottle_tag?: string | null
}
type StaffLink = { name: string; role: string; is_current: boolean }
type Customer = {
  name: string; aliases: string[]; tags?: string[] | null
  company?: string | null; appearance?: string | null
  location?: string | null; note?: string | null; updated_at: string
  bottles: Bottle[]; staff: StaffLink[]
}
type ImportResult = { name: string; status: 'inserted' | 'skipped' | 'error'; message?: string }

export default function DevImportPage() {
  const [text, setText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [existing, setExisting] = useState<string[]>([])
  const [mode, setMode] = useState<'skip' | 'update'>('skip')
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{ inserted: number; skipped: number; errors: number; results: ImportResult[] } | null>(null)
  const [parseError, setParseError] = useState('')

  useEffect(() => {
    fetch('/api/dev/import').then(r => r.json()).then(setExisting)
  }, [])

  async function handleParse() {
    if (!text.trim()) return
    setParsing(true)
    setParseError('')
    setCustomers([])
    setResults(null)
    try {
      const res = await fetch('/api/dev/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (data.error) { setParseError(data.error); return }
      setCustomers(data.customers)
    } catch (e) {
      setParseError(String(e))
    } finally {
      setParsing(false)
    }
  }

  async function handleImport() {
    if (!customers.length) return
    setImporting(true)
    setResults(null)
    try {
      const res = await fetch('/api/dev/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers, mode }),
      })
      const data = await res.json()
      setResults(data)
      // 既存リストを更新
      fetch('/api/dev/import').then(r => r.json()).then(setExisting)
    } finally {
      setImporting(false)
    }
  }

  function removeCustomer(index: number) {
    setCustomers(prev => prev.filter((_, i) => i !== index))
  }

  const duplicates = customers.filter(c => existing.includes(c.name))

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', color: '#f0ede8', fontFamily: 'sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#c9a96e', marginBottom: 4 }}>DEV TOOL</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>顧客データインポート</h1>
          <p style={{ fontSize: 12, color: 'rgba(240,237,232,0.4)', marginTop: 4 }}>
            テキストを貼り付け → AIで解析 → DBに保存
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* 左：入力 */}
          <div>
            <div style={{ fontSize: 12, color: 'rgba(240,237,232,0.5)', marginBottom: 8 }}>
              テキストを貼り付け（❏形式・自由形式どちらでも可）
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={'❏ 田中様　角サン84（残量0.8）あい　R8　1/15\n   ❏ タグ:たなちゃん\n\n❏ 鈴木様 チャミスル33（残量0.5）まな R7 10/3\n...'}
              style={{
                width: '100%', height: 320, background: '#1a1a24',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                color: '#f0ede8', fontSize: 13, padding: 12,
                resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
              <button
                onClick={handleParse}
                disabled={parsing || !text.trim()}
                style={{
                  padding: '10px 24px', background: parsing ? 'rgba(201,169,110,0.3)' : '#c9a96e',
                  color: '#0d0d14', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
                  cursor: parsing ? 'not-allowed' : 'pointer',
                }}
              >
                {parsing ? '解析中...' : '✨ AIで解析'}
              </button>
              <span style={{ fontSize: 12, color: 'rgba(240,237,232,0.3)' }}>
                {text.trim() ? `${text.split('\n').filter(l => l.trim().startsWith('❏') && !l.startsWith('  ')).length} エントリ検出` : ''}
              </span>
            </div>

            {parseError && (
              <div style={{ marginTop: 10, padding: 10, background: 'rgba(212,113,138,0.15)', borderRadius: 8, fontSize: 13, color: '#d4718a' }}>
                {parseError}
              </div>
            )}

            {/* インポート設定 */}
            {customers.length > 0 && (
              <div style={{ marginTop: 20, padding: 14, background: '#1a1a24', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 12, color: 'rgba(240,237,232,0.5)', marginBottom: 10 }}>重複時の処理</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {(['skip', 'update'] as const).map(m => (
                    <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input type="radio" value={m} checked={mode === m} onChange={() => setMode(m)} />
                      {m === 'skip' ? 'スキップ（既存を保持）' : '上書き（ボトルも更新）'}
                    </label>
                  ))}
                </div>
                {duplicates.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#c9a96e' }}>
                    ⚠ {duplicates.length}件が既存顧客と重複: {duplicates.map(d => d.name).join('、')}
                  </div>
                )}

                <button
                  onClick={handleImport}
                  disabled={importing}
                  style={{
                    marginTop: 12, width: '100%', padding: '12px',
                    background: importing ? 'rgba(111,207,151,0.2)' : 'rgba(111,207,151,0.2)',
                    border: '1px solid rgba(111,207,151,0.4)',
                    color: '#6fcf97', borderRadius: 8, fontSize: 14, fontWeight: 700,
                    cursor: importing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {importing ? '保存中...' : `💾 ${customers.length}件をDBに保存`}
                </button>
              </div>
            )}

            {/* 結果 */}
            {results && (
              <div style={{ marginTop: 16, padding: 14, background: '#1a1a24', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                  <span style={{ color: '#6fcf97', fontSize: 14 }}>✓ 保存 {results.inserted}件</span>
                  <span style={{ color: '#c9a96e', fontSize: 14 }}>– スキップ {results.skipped}件</span>
                  {results.errors > 0 && <span style={{ color: '#d4718a', fontSize: 14 }}>✗ エラー {results.errors}件</span>}
                </div>
                {results.results.filter(r => r.status === 'error').map((r, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#d4718a' }}>{r.name}: {r.message}</div>
                ))}
              </div>
            )}
          </div>

          {/* 右：プレビュー */}
          <div>
            <div style={{ fontSize: 12, color: 'rgba(240,237,232,0.5)', marginBottom: 8 }}>
              解析結果プレビュー {customers.length > 0 && `（${customers.length}件）`}
            </div>
            <div style={{ maxHeight: 600, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {customers.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: 'rgba(240,237,232,0.2)', fontSize: 13 }}>
                  解析結果がここに表示されます
                </div>
              )}
              {customers.map((c, i) => {
                const isDuplicate = existing.includes(c.name)
                const activeBottles = c.bottles.filter(b => b.status === 'active')
                const finishedBottles = c.bottles.filter(b => b.status === 'finished')
                return (
                  <div
                    key={i}
                    style={{
                      padding: 14, background: '#1a1a24', borderRadius: 10,
                      border: `1px solid ${isDuplicate ? 'rgba(201,169,110,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      position: 'relative',
                    }}
                  >
                    <button
                      onClick={() => removeCustomer(i)}
                      style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: 'rgba(240,237,232,0.3)', cursor: 'pointer', fontSize: 16 }}
                    >×</button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</span>
                      {c.tags?.map((t: string) => <span key={t} style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(201,169,110,0.15)', color: '#c9a96e', borderRadius: 20 }}>{t}</span>)}
                      {isDuplicate && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(201,169,110,0.15)', color: '#c9a96e', borderRadius: 20 }}>既存</span>}
                    </div>

                    {c.aliases.length > 0 && (
                      <div style={{ fontSize: 12, color: 'rgba(240,237,232,0.4)', marginBottom: 4 }}>
                        {c.aliases.join(' / ')}
                      </div>
                    )}

                    {activeBottles.length > 0 && (
                      <div style={{ marginBottom: 4 }}>
                        {activeBottles.map((b, j) => (
                          <span key={j} style={{ display: 'inline-block', fontSize: 12, marginRight: 8 }}>
                            🍾 {b.brand}{b.number ? ` #${b.number}` : ''} {b.remaining != null ? `(${b.remaining})` : ''}
                            {b.location && <span style={{ color: 'rgba(240,237,232,0.4)' }}> {b.location}</span>}
                          </span>
                        ))}
                      </div>
                    )}

                    {finishedBottles.length > 0 && (
                      <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.3)', marginBottom: 4 }}>
                        飲み切り: {finishedBottles.map(b => b.brand + (b.number ? `#${b.number}` : '')).join('、')}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                      {c.staff.map((s, j) => (
                        <span key={j} style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20,
                          background: s.is_current ? 'rgba(124,156,192,0.15)' : 'rgba(255,255,255,0.05)',
                          color: s.is_current ? '#7c9cc0' : 'rgba(240,237,232,0.3)',
                        }}>
                          {s.name} {s.role}
                        </span>
                      ))}
                    </div>

                    {c.note && <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.35)', marginTop: 4 }}>{c.note}</div>}
                    <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.2)', marginTop: 4 }}>{c.updated_at}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
