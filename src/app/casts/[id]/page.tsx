import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCast, getVisitRecordsByCast, getCustomers, getBottles, getCasts } from '@/lib/kv'
import { CastVisitGroup } from '@/components/cast-visit-group'
import { CustomerCard } from '@/components/customer-card'
import { isAuthenticated } from '@/lib/auth'
import { formatEditedBy } from '@/lib/utils'
import { DeleteConfirmButton } from '@/components/delete-confirm-button'
import { deleteCastAction } from './delete-actions'

export const dynamic = 'force-dynamic'

export default async function CastDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [cast, visits, customers, allCasts, bottles, loggedIn] = await Promise.all([
    getCast(id),
    getVisitRecordsByCast(id),
    getCustomers(),
    getCasts(),
    getBottles(),
    isAuthenticated(),
  ])

  if (!cast) notFound()

  const customerMap = new Map(customers.map((c) => [c.id, c]))

  // 顧客ごとにグループ化
  const visitsByCustomer = new Map<string, typeof visits>()
  for (const visit of visits) {
    const arr = visitsByCustomer.get(visit.customerId) ?? []
    arr.push(visit)
    visitsByCustomer.set(visit.customerId, arr)
  }
  // 各顧客の最新来店日でソート
  const sortedCustomerIds = Array.from(visitsByCustomer.keys()).sort((a, b) => {
    const latestA = Math.max(...visitsByCustomer.get(a)!.map((v) => new Date(v.visitDate).getTime()))
    const latestB = Math.max(...visitsByCustomer.get(b)!.map((v) => new Date(v.visitDate).getTime()))
    return latestB - latestA
  })

  return (
    <div className="min-h-screen pb-10">
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-brand-beige px-4 py-3 flex items-center gap-3">
        <Link href="/casts">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-plum/60">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-bold text-brand-plum flex-1">{cast.name}</h1>
        {loggedIn && (
          <div className="flex items-center gap-2">
            <Link href={`/casts/${id}/edit`}>
              <Button variant="outline" size="sm" className="border-brand-beige text-brand-plum/80 hover:text-brand-plum">
                <Edit className="h-3.5 w-3.5 mr-1" />
                編集
              </Button>
            </Link>
            <DeleteConfirmButton
              action={deleteCastAction.bind(null, id)}
              redirectTo="/casts"
              itemName={cast.name}
            />
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Profile */}
        <div className="rounded-xl border border-brand-beige bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-plum text-white flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
              {cast.ruby}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand-plum">{cast.name}</h2>
            </div>
          </div>

          {/* メモ */}
          <div className="rounded-lg border border-brand-beige bg-white p-3">
            <p className="text-xs text-brand-plum/50 mb-1">メモ</p>
            {cast.memo ? (
              <p className="text-sm text-brand-plum whitespace-pre-wrap">{cast.memo}</p>
            ) : (
              <p className="text-sm text-brand-plum/50">なし</p>
            )}
          </div>

          {/* 担当顧客数 */}
          <div className="rounded-lg bg-white border border-brand-beige p-3 text-center">
            <p className="text-2xl font-bold text-brand-plum">
              {new Set(visits.map((v) => v.customerId)).size}
            </p>
            <p className="text-xs text-brand-plum/60 mt-0.5">担当顧客数</p>
          </div>

          {cast.updatedBy && (
            <p className="text-xs text-brand-plum/50 text-right">
              {formatEditedBy(cast.updatedBy, cast.updatedAt)}
            </p>
          )}
        </div>

        {/* 指名客一覧 */}
        {sortedCustomerIds.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-brand-plum/60 uppercase tracking-wider mb-1 flex items-center gap-2">
              指名客 ({sortedCustomerIds.length})
            </h3>
            <div>
              {sortedCustomerIds.map((customerId) => {
                const customer = customerMap.get(customerId)
                if (!customer) return null
                const customerBottles = bottles.filter((b) => b.customerId === customerId)
                const designatedCastRuby = customer.designatedCastIds[0]
                  ? allCasts.find((c) => c.id === customer.designatedCastIds[0])?.ruby
                  : undefined
                return (
                  <CustomerCard
                    key={customerId}
                    customer={customer}
                    bottles={customerBottles}
                    designatedCastRuby={designatedCastRuby}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Visit Records */}
        <div>
          <h3 className="text-sm font-semibold text-brand-plum/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            指名履歴 ({visits.length})
          </h3>
          {visits.length === 0 ? (
            <p className="text-brand-plum/50 text-sm">指名履歴はありません</p>
          ) : (
            <div className="space-y-4">
              {sortedCustomerIds.map((customerId) => {
                const customer = customerMap.get(customerId)
                if (!customer) return null
                return (
                  <CastVisitGroup
                    key={customerId}
                    customer={customer}
                    visits={visitsByCustomer.get(customerId)!}
                    casts={allCasts}
                    bottles={bottles}
                    loggedIn={loggedIn}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
