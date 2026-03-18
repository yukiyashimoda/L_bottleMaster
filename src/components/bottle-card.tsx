import { BottleWine } from 'lucide-react'
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
      className="relative flex items-center gap-3 p-3 rounded-lg border border-stone-200 overflow-hidden"
      style={{
        background: `linear-gradient(to right, #d4b896 0%, #d4b896 ${pct}%, #fafaf9 ${pct}%, #fafaf9 100%)`,
      }}
    >
      <div className="w-9 h-9 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
        <BottleWine className="h-5 w-5 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm truncate">{bottle.name}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          開封日: {formatDate(bottle.openedDate)}
        </div>
      </div>
      <div className="text-sm font-semibold text-gray-700">{bottle.remaining}</div>
    </div>
  )
}
