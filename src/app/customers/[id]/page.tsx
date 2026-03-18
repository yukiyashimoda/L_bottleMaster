import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getCustomer,
  getBottlesByCustomer,
  getVisitRecordsByCustomer,
  getCasts,
  getCustomers,
} from '@/lib/kv'
import { formatDate, formatCurrency, formatEditedBy } from '@/lib/utils'
import { isAuthenticated } from '@/lib/auth'
import { DeleteConfirmButton } from '@/components/delete-confirm-button'
import { deleteCustomerAction } from './delete-actions'
import { BottleCard } from '@/components/bottle-card'
import { VisitCard } from '@/components/visit-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertTriangle,
  ArrowLeft,
  Edit,
  BottleWine,
  Calendar,
  Users,
  Plus,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [customer, bottles, visits, casts, allCustomers, loggedIn] = await Promise.all([
    getCustomer(id),
    getBottlesByCustomer(id),
    getVisitRecordsByCustomer(id),
    getCasts(),
    getCustomers(),
    isAuthenticated(),
  ])

  if (!customer) notFound()

  const castMap = new Map(casts.map((c) => [c.id, c]))
  const customerMap = new Map(allCustomers.map((c) => [c.id, c]))
  const designatedCasts = customer.designatedCastIds
    .map((id) => castMap.get(id))
    .filter(Boolean)
  const linkedCustomers = customer.linkedCustomerIds
    .map((cid) => customerMap.get(cid))
    .filter(Boolean)

  const designatedCastRuby = designatedCasts[0]?.ruby
  const avatarLabel = designatedCastRuby ?? 'FREE'

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-bold text-gray-900 flex-1 truncate">{customer.name}</h1>
        {loggedIn && (
          <div className="flex items-center gap-2">
            <Link href={`/customers/${id}/edit`}>
              <Button variant="outline" size="sm" className="border-stone-200 text-gray-600 hover:text-gray-900">
                <Edit className="h-3.5 w-3.5 mr-1" />
                編集
              </Button>
            </Link>
            <DeleteConfirmButton
              action={deleteCustomerAction.bind(null, id)}
              redirectTo="/"
              itemName={customer.name}
            />
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Profile Card */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          {/* 名前・ニックネーム */}
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 overflow-hidden ${customer.isAlert ? 'bg-red-100 text-red-600' : designatedCastRuby ? 'bg-gray-700 text-white' : 'bg-green-600 text-white'}`}>
              {avatarLabel}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
                {customer.isAlert && (
                  <Badge variant="danger" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    要確認
                  </Badge>
                )}
              </div>
              <p className="text-gray-400 text-sm">{customer.ruby}</p>
              {customer.nickname && (
                <p className="text-gray-600 text-sm mt-0.5">
                  ニックネーム: {customer.nickname}
                </p>
              )}
              {customer.isAlert && customer.alertReason && (
                <div className="mt-2 flex items-start gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="whitespace-pre-wrap">{customer.alertReason}</span>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* 本指名キャスト + ボトル本数 */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-0.5">本指名キャスト</p>
              <p className="text-gray-900 font-medium">
                {designatedCasts.length > 0
                  ? designatedCasts.map((c) => c!.name).join('・')
                  : '未設定'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">ボトル本数</p>
              <p className="text-gray-900 font-medium flex items-center gap-1">
                <BottleWine className="h-3.5 w-3.5 text-gray-400" />
                {bottles.length} 本
              </p>
            </div>
          </div>

          {customer.memo && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-gray-400 text-xs mb-1">特記事項</p>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{customer.memo}</p>
              </div>
            </>
          )}

          {customer.updatedBy && (
            <p className="text-xs text-gray-400 mt-3 text-right">
              {formatEditedBy(customer.updatedBy, customer.updatedAt)}
            </p>
          )}
        </div>

        {/* キープボトル一覧 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BottleWine className="h-4 w-4" />
            ボトルキープ ({bottles.length})
          </h3>
          {bottles.length === 0 ? (
            <p className="text-gray-400 text-sm">ボトルはありません</p>
          ) : (
            <div className="space-y-2">
              {bottles.map((bottle) => (
                <BottleCard key={bottle.id} bottle={bottle} />
              ))}
            </div>
          )}
        </div>

        {/* 来店回数 + 最終来店日 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm text-sm">
            <p className="text-gray-400 text-xs mb-1">来店回数</p>
            <p className="text-gray-900 font-bold text-lg">{visits.length} <span className="text-sm font-normal">回</span></p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm text-sm">
            <p className="text-gray-400 text-xs mb-1">最終来店</p>
            <p className="text-gray-900 font-medium flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              {formatDate(customer.lastVisitDate)}
            </p>
          </div>
        </div>

        {/* Linked Customers */}
        {linkedCustomers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              同伴者・グループ
            </h3>
            <div className="space-y-2">
              {linkedCustomers.map((linked) => (
                <Link
                  key={linked!.id}
                  href={`/customers/${linked!.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white border border-stone-200 hover:border-gray-400 transition-colors shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-bold">
                    {linked!.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium text-sm">{linked!.name}</p>
                    <p className="text-gray-400 text-xs">{linked!.ruby}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Visit History */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            来店履歴 ({visits.length})
          </h3>
          {visits.length === 0 ? (
            <p className="text-gray-400 text-sm">来店履歴はありません</p>
          ) : (
            <div className="space-y-3">
              {visits.map((visit) => (
                <VisitCard
                  key={visit.id}
                  visit={visit}
                  casts={casts}
                  bottles={bottles}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {loggedIn && (
        <div className="px-4 pb-6">
          <Link href={`/customers/${id}/visits/new`}>
            <Button className="w-full bg-gray-900 hover:bg-gray-700 text-white font-bold h-11">
              <Plus className="h-4 w-4 mr-2" />
              来店を記録する
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
