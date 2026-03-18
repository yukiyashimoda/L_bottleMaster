import { GiBrandyBottle } from 'react-icons/gi'
import { formatDate } from '@/lib/utils'
import type { Bottle } from '@/types'

interface BottleCardProps {
  bottle: Bottle
}

function remainingPercent(remaining: string): number {
  const n = parseInt(remaining)
  if (!isNaN(n)) return Math.min(100, Math.max(0, n))
  if (remaining === '少量') return 5
  return 0
}

export function BottleCard({ bottle }: BottleCardProps) {
  const pct = remainingPercent(bottle.remaining)

  return (
    <div
      className="relative flex items-center gap-3 p-3 rounded-lg border border-brand-beige overflow-hidden"
      style={{
        background: `linear-gradient(to right, #4B3C52 0%, #4B3C52 ${pct}%, #fafaf9 ${pct}%, #fafaf9 100%)`,
      }}
    >
      <div className="flex items-center justify-center shrink-0" style={{ mixBlendMode: 'difference' }}>
        <GiBrandyBottle size={20} color="white" />
      </div>
      <div className="flex-1 min-w-0" style={{ mixBlendMode: 'difference' }}>
        <div className="font-medium text-white text-sm truncate">{bottle.name}</div>
        <div className="text-xs text-white/80 mt-0.5">
          開封日: {formatDate(bottle.openedDate)}
        </div>
      </div>
      <div className="text-sm font-semibold text-white" style={{ mixBlendMode: 'difference' }}>{bottle.remaining}</div>
    </div>
  )
}
