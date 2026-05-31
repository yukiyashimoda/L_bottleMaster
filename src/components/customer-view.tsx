'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, LogOut } from 'lucide-react'
import { CustomerCard } from '@/components/customer-card'
import { getHiraganaGroup, hiraganaGroups, isOldVisit } from '@/lib/utils'
import { logoutAction } from '@/app/login/actions'
import type { Customer, Bottle, Cast } from '@/types'

const CAST_COLORS = [
  'var(--accent)', 'var(--accent2)', '#22C55E', '#F59E0B',
  '#EC4899', '#14B8A6', '#3B82F6', '#A855F7',
  '#F97316', '#06B6D4', '#84CC16', '#EF4444',
]

// カード用アクセントカラー（キャストアイコンには使わない）
const cardAccentColor = (i: number) => CAST_COLORS[i % CAST_COLORS.length]

interface Props {
  customers: Customer[]
  casts: Cast[]
  bottlesMap: Record<string, Bottle[]>
  loggedIn: boolean
}

export function CustomerView({ customers, casts, bottlesMap, loggedIn }: Props) {
  const [selectedCast, setSelectedCast] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const activeCasts = casts.filter(c =>
    customers.some(cu => cu.designatedCastIds.includes(c.id))
  )

  const handleLogout = async () => {
    await logoutAction()
    router.push('/')
    router.refresh()
    setSidebarOpen(false)
  }

  // 検索フィルター
  const searchFiltered = query.trim()
    ? customers.filter(c =>
        c.name.includes(query) || c.ruby.includes(query) || c.nickname.includes(query)
      )
    : null

  // キャストフィルター
  const castFiltered = selectedCast
    ? customers.filter(c => c.designatedCastIds.includes(selectedCast))
    : customers

  // グループ化
  const grouped = new Map<string, Customer[]>()
  for (const group of hiraganaGroups) {
    const inGroup = castFiltered.filter(c => getHiraganaGroup(c.ruby) === group)
    if (inGroup.length > 0) grouped.set(group, inGroup)
  }

  return (
    <>
      {/* ── 固定ヘッダー ── */}
      <div
        className="sticky top-0 z-30"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid hsl(var(--border))' }}
      >
        {/* アプリアイコン行 */}
        <div className="flex justify-end px-4 pt-3 pb-1">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              overflow: 'hidden', padding: 0,
              border: '2px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            <img src="/apple-touch-icon.png" alt="menu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        </div>

        {/* 検索バー行 */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="名前・ふりがな・ニックネームで検索"
              className="w-full pl-9 pr-9 py-2.5 rounded-2xl text-sm outline-none"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
                border: 'none',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* キャストフィルター行 */}
        <div
          className="overflow-x-auto pb-3 px-3"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex items-end gap-3 w-max">
            {/* 全員 */}
            <button
              onClick={() => setSelectedCast(null)}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: !selectedCast ? 'var(--text)' : 'var(--bg-elevated)',
                  color: !selectedCast ? 'var(--bg)' : 'var(--text-sub)',
                  transform: !selectedCast ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                全員
              </div>
              <span className="text-[10px]" style={{ color: !selectedCast ? 'var(--text)' : 'var(--text-muted)' }}>
                {customers.length}
              </span>
            </button>

            {activeCasts.map((cast, i) => {
              const count = customers.filter(c => c.designatedCastIds.includes(cast.id)).length
              const active = selectedCast === cast.id
              return (
                <button
                  key={cast.id}
                  onClick={() => setSelectedCast(active ? null : cast.id)}
                  className="flex flex-col items-center gap-1 shrink-0"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                    style={{
                      background: active ? 'var(--text)' : 'transparent',
                      color: active ? 'var(--bg)' : 'var(--text-sub)',
                      border: `2px solid ${active ? 'var(--text)' : 'var(--text-sub)'}`,
                      transform: active ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    {cast.ruby?.charAt(0) || cast.name.charAt(0)}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}>
                    {cast.ruby || cast.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 検索結果 ── */}
      {searchFiltered && (
        <div className="pb-4">
          {searchFiltered.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
              該当する顧客が見つかりません
            </p>
          ) : (
            searchFiltered.map(c => (
              <CustomerCard
                key={c.id}
                customer={c}
                bottles={bottlesMap[c.id] ?? []}
                designatedCastRuby={c.designatedCastIds[0] ? casts.find(ca => ca.id === c.designatedCastIds[0])?.ruby : undefined}
                accentColor={c.designatedCastIds[0] ? cardAccentColor(activeCasts.findIndex(ca => ca.id === c.designatedCastIds[0])) : undefined}
              />
            ))
          )}
        </div>
      )}

      {/* ── 顧客リスト ── */}
      {!searchFiltered && (
        <div className="pb-28">
          {grouped.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-muted)' }}>
              <p className="text-base">顧客が見つかりません</p>
            </div>
          ) : (
            Array.from(grouped.entries()).map(([group, groupCustomers]) => (
              <div key={group}>
                <div className="px-5 pt-5 pb-1.5">
                  <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                    {group}
                  </span>
                </div>
                {groupCustomers.map(c => (
                  <CustomerCard
                    key={c.id}
                    customer={c}
                    bottles={bottlesMap[c.id] ?? []}
                    designatedCastRuby={c.designatedCastIds[0] ? casts.find(ca => ca.id === c.designatedCastIds[0])?.ruby : undefined}
                    accentColor={c.designatedCastIds[0] ? cardAccentColor(activeCasts.findIndex(ca => ca.id === c.designatedCastIds[0])) : undefined}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── サイドバーオーバーレイ ── */}
      <div
        onClick={() => setSidebarOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.4)',
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s',
        }}
      />

      {/* ── サイドバー ── */}
      <aside
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 70,
          width: 260,
          background: 'var(--bg-surface)',
          borderLeft: '1px solid hsl(var(--border))',
          boxShadow: sidebarOpen ? '-8px 0 32px rgba(0,0,0,0.2)' : 'none',
          display: 'flex', flexDirection: 'column',
          padding: '16px 16px 32px',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          style={{ alignSelf: 'flex-end', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 8 }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 0 28px' }}>
          <img src="/apple-touch-icon.png" alt="L" style={{ width: 76, height: 76, borderRadius: '50%', border: '2px solid var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 2 }}>Neo Snack L</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-audiowide)' }}>Bottle Master</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {[
            { href: '/', label: '顧客' },
            { href: '/casts', label: 'キャスト' },
            { href: '/favorites', label: 'お気に入り' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '12px 16px', borderRadius: 12,
                color: 'var(--text-sub)', textDecoration: 'none',
                fontSize: 15, fontWeight: 500,
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {loggedIn && (
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 12,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 15, fontWeight: 500,
            }}
          >
            <LogOut size={18} strokeWidth={2} style={{ stroke: 'var(--text-muted)', fill: 'none' }} />
            ログアウト
          </button>
        )}
      </aside>
    </>
  )
}
