import { BottleWine } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Bottle } from '@/types'

interface BottleCardProps {
  bottle: Bottle
}

const remainingStyle: Record<string, string> = {
  '100%': 'text-gray-900 font-bold',
  '75%':  'text-gray-700 font-semibold',
  '50%':  'text-gray-500',
  '30%':  'text-gray-400',
  '少量': 'text-red-500 font-semibold',
}

export function BottleCard({ bottle }: BottleCardProps) {
  const style = remainingStyle[bottle.remaining] ?? 'text-gray-500'

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 border border-stone-200">
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <BottleWine className="h-5 w-5 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm truncate">{bottle.name}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          開封日: {formatDate(bottle.openedDate)}
        </div>
      </div>
      <div className={`text-sm ${style}`}>{bottle.remaining}</div>
    </div>
  )
}
