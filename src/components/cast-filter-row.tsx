'use client'
import { useState } from 'react'
import type { Cast, Customer, Bottle } from '@/types'
import { CustomerCard } from '@/components/customer-card'
import { getHiraganaGroup, hiraganaGroups } from '@/lib/utils'

// キャストアバターの色サイクル（THEME変数で統一する場合はここを変更）
const CAST_COLORS = [
  'var(--theme-accent)', 'var(--theme-accent2)', '#22C55E', '#F59E0B',
  '#EC4899',       '#14B8A6',        '#3B82F6', '#A855F7',
  '#F97316',       '#06B6D4',        '#84CC16', '#EF4444',
]

interface Props {
  casts: Cast[]
  customers: Customer[]
  bottlesMap: Record<string, Bottle[]>
}

export function CastFilterRow({ casts, customers, bottlesMap }: Props) {
  const [selectedCastId, setSelectedCastId] = useState<string | null>(null)

  const filtered = selectedCastId
    ? customers.filter(c => c.designatedCastIds.includes(selectedCastId))
    : customers

  const grouped = new Map<string, Customer[]>()
  for (const group of hiraganaGroups) {
    const inGroup = filtered.filter(c => getHiraganaGroup(c.ruby) === group)
    if (inGroup.length > 0) grouped.set(group, inGroup)
  }

  return (
    <>
      {/* キャストフィルター行 */}
      <div
        className="sticky z-20 px-4 py-3 overflow-x-auto"
        style={{
          top: 60,
          background: 'var(--bg)',
          borderBottom: '1px solid hsl(var(--border))',
          scrollbarWidth: 'none',
        }}
      >
        <div className="flex items-center gap-2.5 w-max">
          {/* 全員チップ */}
          <button
            onClick={() => setSelectedCastId(null)}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: selectedCastId === null ? 'var(--text)' : 'var(--bg-elevated)',
                color: selectedCastId === null ? 'var(--bg)' : 'var(--text-sub)',
                boxShadow: selectedCastId === null ? 'var(--shadow)' : 'none',
                transform: selectedCastId === null ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              全員
            </div>
            <span className="text-[10px]" style={{ color: selectedCastId === null ? 'var(--text)' : 'var(--text-muted)' }}>
              {customers.length}
            </span>
          </button>

          {/* キャストアバター */}
          {casts.map((cast, i) => {
            const color = CAST_COLORS[i % CAST_COLORS.length]
            const count = customers.filter(c => c.designatedCastIds.includes(cast.id)).length
            const active = selectedCastId === cast.id
            return (
              <button
                key={cast.id}
                onClick={() => setSelectedCastId(active ? null : cast.id)}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                  style={{
                    background: active ? color : `${color}22`,
                    color: active ? '#fff' : color,
                    border: `2px solid ${active ? color : 'transparent'}`,
                    boxShadow: active ? `0 4px 12px ${color}50` : 'none',
                    transform: active ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {cast.ruby?.charAt(0) || cast.name.charAt(0)}
                </div>
                <span className="text-[10px] font-medium" style={{ color: active ? color : 'var(--text-muted)' }}>
                  {cast.ruby || cast.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 顧客リスト */}
      <div className="pb-28">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-muted)' }}>
            <p className="text-base">顧客が見つかりません</p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([group, groupCustomers]) => (
            <div key={group} id={`group-${group}`}>
              <div
                className="px-5 pt-5 pb-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="text-[11px] font-semibold tracking-widest uppercase">{group}</span>
              </div>
              {groupCustomers.map(customer => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  bottles={bottlesMap[customer.id] ?? []}
                  designatedCastRuby={
                    customer.designatedCastIds[0]
                      ? casts.find(c => c.id === customer.designatedCastIds[0])?.ruby
                      : undefined
                  }
                  accentColor={
                    customer.designatedCastIds[0]
                      ? CAST_COLORS[casts.findIndex(c => c.id === customer.designatedCastIds[0]) % CAST_COLORS.length]
                      : undefined
                  }
                />
              ))}
            </div>
          ))
        )}
      </div>
    </>
  )
}
