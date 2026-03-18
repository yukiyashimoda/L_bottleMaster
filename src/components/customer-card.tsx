import Link from 'next/link'
import { AlertTriangle, BottleWine, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate, isOldVisit } from '@/lib/utils'
import type { Customer, Bottle } from '@/types'

interface CustomerCardProps {
  customer: Customer
  bottles: Bottle[]
  designatedCastName?: string
}

export function CustomerCard({ customer, bottles, designatedCastName }: CustomerCardProps) {
  const old = isOldVisit(customer.lastVisitDate)
  const avatarLabel = designatedCastName
    ? designatedCastName.charAt(0)
    : customer.name.charAt(0)

  return (
    <Link href={`/customers/${customer.id}`}>
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 border-b border-stone-200 transition-colors hover:bg-stone-100',
          old && 'bg-stone-100 hover:bg-stone-200'
        )}
      >
        {/* Avatar */}
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
          customer.isAlert ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'
        )}>
          {avatarLabel}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 truncate">
              {customer.name}
            </span>
            {customer.nickname && (
              <span className="text-xs text-gray-400 truncate">
                ({customer.nickname})
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">{customer.ruby}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Calendar className={cn('h-3 w-3', old ? 'text-orange-400' : 'text-gray-400')} />
            <span className={cn(
              'text-xs rounded px-1',
              old
                ? 'text-orange-700 font-bold bg-orange-100'
                : 'text-gray-500'
            )}>
              最終来店: {formatDate(customer.lastVisitDate)}
            </span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {customer.isAlert && (
            <Badge variant="danger" className="flex items-center gap-1 text-xs">
              <AlertTriangle className="h-3 w-3" />
              要確認
            </Badge>
          )}
          {bottles.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <BottleWine className="h-3 w-3" />
              <span>{bottles.length}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
