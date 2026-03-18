import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Edit, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCast, getVisitRecordsByCast, getCustomers, getBottles, getCasts } from '@/lib/kv'
import { VisitCard } from '@/components/visit-card'
import { isAuthenticated } from '@/lib/auth'
import { formatEditedBy } from '@/lib/utils'

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

  return (
    <div className="min-h-screen pb-10">
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3 flex items-center gap-3">
        <Link href="/casts">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-bold text-gray-900 flex-1">{cast.name}</h1>
        {loggedIn && (
          <Link href={`/casts/${id}/edit`}>
            <Button variant="outline" size="sm" className="border-stone-200 text-gray-600 hover:text-gray-900">
              <Edit className="h-3.5 w-3.5 mr-1" />
              編集
            </Button>
          </Link>
        )}
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Profile */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-2xl font-bold shrink-0">
              {cast.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{cast.name}</h2>
              <p className="text-gray-400">{cast.ruby}</p>
            </div>
          </div>

          {/* メモ */}
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs text-gray-400 mb-1">メモ</p>
            {cast.memo ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{cast.memo}</p>
            ) : (
              <p className="text-sm text-gray-400">なし</p>
            )}
          </div>

          {/* 担当顧客数 */}
          <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 text-center">
            <p className="text-2xl font-bold text-gray-700">
              {new Set(visits.map((v) => v.customerId)).size}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">担当顧客数</p>
          </div>

          {cast.updatedBy && (
            <p className="text-xs text-gray-400 text-right">
              {formatEditedBy(cast.updatedBy, cast.updatedAt)}
            </p>
          )}
        </div>

        {/* Visit Records */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            指名履歴 ({visits.length})
          </h3>
          {visits.length === 0 ? (
            <p className="text-gray-400 text-sm">指名履歴はありません</p>
          ) : (
            <div className="space-y-4">
              {visits.map((visit) => {
                const customer = customerMap.get(visit.customerId)
                return (
                  <div key={visit.id} className="space-y-2">
                    {customer && (
                      <Link
                        href={`/customers/${customer.id}`}
                        className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
                      >
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        {customer.name}
                        <span className="text-gray-400 text-xs font-normal">
                          ({customer.ruby})
                        </span>
                      </Link>
                    )}
                    <VisitCard
                      visit={visit}
                      casts={allCasts}
                      bottles={bottles}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
