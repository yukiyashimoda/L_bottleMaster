import Link from 'next/link'
import { AlertTriangle, Clock } from 'lucide-react'
import { GiBrandyBottle } from 'react-icons/gi'
import { FavoriteButton } from '@/components/favorite-button'
import { cn, formatDate, isOldVisit } from '@/lib/utils'
import type { Customer, Bottle } from '@/types'

interface CustomerCardProps {
  customer: Customer
  bottles: Bottle[]
  designatedCastRuby?: string
}

export function CustomerCard({ customer, bottles, designatedCastRuby }: CustomerCardProps) {
  const old = isOldVisit(customer.lastVisitDate)
  const activeBottles = bottles.filter(b => b.remaining && b.remaining !== '0%')

  return (
    <Link href={`/customers/${customer.id}`}>
      <div
        className={cn(
          'relative flex items-center gap-3 px-4 py-3.5 mx-3 my-1.5 rounded-2xl transition-all duration-200',
          'hover:scale-[1.01] active:scale-[0.99]',
        )}
        style={{
          background: 'var(--bg-surface)',
          border: `1px solid ${old ? 'rgba(212,113,138,0.3)' : 'var(--border)'}`,
          boxShadow: old ? '0 2px 12px rgba(212,113,138,0.1)' : 'var(--shadow)',
        }}
      >
        {old && (
          <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ background: 'var(--coral)' }} />
        )}

        {/* アバター */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[9px] font-bold shrink-0 tracking-wide"
          style={
            customer.isAlert
              ? { background: 'var(--coral-bg)', color: 'var(--coral)' }
              : designatedCastRuby
              ? { background: 'var(--gold-bg)', color: 'var(--gold)' }
              : { background: 'var(--bg-elevated)', color: 'var(--text-muted)' }
          }
        >
          {designatedCastRuby ?? 'FREE'}
        </div>

        {/* メイン情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>
              {customer.name}
            </span>
            {customer.nickname && (
              <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {customer.nickname}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" style={{ color: old ? 'var(--coral)' : 'var(--text-muted)' }} />
              <span className="text-[10px]" style={{ color: old ? 'var(--coral)' : 'var(--text-muted)' }}>
                {formatDate(customer.lastVisitDate)}
              </span>
            </div>
            {activeBottles.length > 0 && (
              <div className="flex items-center gap-1">
                <GiBrandyBottle size={10} style={{ color: 'var(--gold)' }} />
                <div className="flex gap-0.5 items-end">
                  {activeBottles.slice(0, 3).map((b, i) => {
                    const pct = parseInt(b.remaining) || 0
                    return (
                      <div key={i} className="w-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                        <div
                          className="w-full rounded-full"
                          style={{
                            height: `${pct}%`,
                            marginTop: `${100 - pct}%`,
                            background: pct > 50 ? 'var(--gold)' : pct > 20 ? '#e08a4a' : 'var(--coral)',
                          }}
                        />
                      </div>
                    )
                  })}
                  {activeBottles.length > 3 && (
                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>+{activeBottles.length - 3}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右側バッジ */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {customer.isAlert && (
            <div className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: 'var(--coral-bg)', color: 'var(--coral)' }}>
              <AlertTriangle className="h-2.5 w-2.5" />要確認
            </div>
          )}
          {customer.hasGlass && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'var(--gold-bg)', color: 'var(--gold)' }}>
              グラス
            </span>
          )}
        </div>

        <FavoriteButton customerId={customer.id} isFavorite={customer.isFavorite} />
      </div>
    </Link>
  )
}
