import { Calendar, User, BottleWine } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { VisitRecord, Cast, Bottle } from '@/types'

interface VisitCardProps {
  visit: VisitRecord
  casts: Cast[]
  bottles: Bottle[]
}

export function VisitCard({ visit, casts, bottles }: VisitCardProps) {
  const castMap = new Map(casts.map((c) => [c.id, c]))

  const designatedCasts = visit.designatedCastIds
    .map((id) => castMap.get(id))
    .filter(Boolean)
  const inStoreCasts = visit.inStoreCastIds
    .map((id) => castMap.get(id))
    .filter(Boolean)

  const bottleMap = new Map(bottles.map((b) => [b.id, b]))
  const openedBottles = visit.bottlesOpened
    .map((id) => bottleMap.get(id))
    .filter(Boolean) as Bottle[]
  const usedBottles = visit.bottlesUsed
    .map((id) => bottleMap.get(id))
    .filter(Boolean) as Bottle[]

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3 shadow-sm">
      {/* Date */}
      <div className="flex items-center gap-2 text-gray-900 font-semibold">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span>{formatDate(visit.visitDate)}</span>
      </div>

      {/* Casts */}
      {(designatedCasts.length > 0 || inStoreCasts.length > 0) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {designatedCasts.length > 0 && (
            <div className="flex items-center gap-1 text-gray-700">
              <User className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-400">本指名:</span>
              <span className="font-medium">{designatedCasts.map((c) => c!.name).join('・')}</span>
            </div>
          )}
          {inStoreCasts.length > 0 && (
            <div className="flex items-center gap-1 text-gray-700">
              <User className="h-3.5 w-3.5 text-gray-300" />
              <span className="text-gray-400">場内:</span>
              <span>{inStoreCasts.map((c) => c!.name).join('・')}</span>
            </div>
          )}
        </div>
      )}

      {/* Bottles */}
      {openedBottles.length > 0 && (
        <div className="text-sm flex items-center gap-1.5">
          <BottleWine className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-400">開封:</span>
          <span className="text-gray-700">{openedBottles.map((b) => b.name).join(', ')}</span>
        </div>
      )}
      {usedBottles.length > 0 && (
        <div className="text-sm flex items-center gap-1.5">
          <BottleWine className="h-3.5 w-3.5 text-gray-300" />
          <span className="text-gray-400">使用:</span>
          <span className="text-gray-600">{usedBottles.map((b) => b.name).join(', ')}</span>
        </div>
      )}

      {/* Memo */}
      {visit.memo && (
        <p className="text-sm text-gray-500 border-t border-stone-100 pt-2">
          {visit.memo}
        </p>
      )}
    </div>
  )
}
