import Link from 'next/link'
import { AlertTriangle, Clock } from 'lucide-react'
import { GiBrandyBottle } from 'react-icons/gi'
import { FavoriteButton } from '@/components/favorite-button'
import { formatDate, isOldVisit } from '@/lib/utils'
import type { Customer, Bottle } from '@/types'

interface CustomerCardProps {
  customer: Customer
  bottles: Bottle[]
  designatedCastRuby?: string
  accentColor?: string
}

export function CustomerCard({ customer, bottles, designatedCastRuby, accentColor }: CustomerCardProps) {
  const old = isOldVisit(customer.lastVisitDate)
  const activeBottles = bottles.filter(b => b.remaining && parseInt(b.remaining) > 0)

  return (
    <Link href={`/customers/${customer.id}`}>
      <div
        className="flex items-center gap-3 mx-3 my-1.5 rounded-2xl transition-all duration-150 active:scale-[0.98]"
        style={{
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex items-center gap-3 w-full px-4 py-3.5">
          {/* アバター */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[9px] font-bold shrink-0 text-center leading-tight"
            style={{
              background: accentColor ? `${accentColor}20` : 'var(--bg-elevated)',
              color: accentColor ?? 'var(--text-muted)',
              border: `1.5px solid ${accentColor ? `${accentColor}40` : 'transparent'}`,
            }}
          >
            {designatedCastRuby ?? 'FREE'}
          </div>

          {/* 情報 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-[15px] truncate" style={{ color: 'var(--text)' }}>
                {customer.name}
              </span>
              {customer.nickname && (
                <span className="text-xs truncate shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {customer.nickname}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" style={{ color: old ? 'var(--theme-accent)' : 'var(--text-muted)' }} />
                <span className="text-[11px]" style={{ color: old ? 'var(--theme-accent)' : 'var(--text-muted)' }}>
                  {formatDate(customer.lastVisitDate)}
                </span>
              </div>

              {activeBottles.length > 0 && (
                <div className="flex items-center gap-1">
                  <GiBrandyBottle size={11} style={{ color: 'var(--theme-gold)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {activeBottles.length}本
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 右側 */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {customer.isAlert && (
              <div
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--accent-bg)', color: 'var(--theme-accent)' }}
              >
                <AlertTriangle className="h-2.5 w-2.5" />要確認
              </div>
            )}
            {customer.hasGlass && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--gold-bg)', color: 'var(--theme-gold)' }}>
                グラス
              </span>
            )}
          </div>

          <FavoriteButton customerId={customer.id} isFavorite={customer.isFavorite} />
        </div>
      </div>
    </Link>
  )
}
