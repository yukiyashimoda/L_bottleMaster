import { getCustomers, getBottlesByCustomer, getCasts } from '@/lib/kv'
import { CastFilterRow } from '@/components/cast-filter-row'
import { Fab } from '@/components/fab'
import { CustomerSearch } from './customer-search'
import { isAuthenticated } from '@/lib/auth'
import type { Bottle, Cast } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CustomerListPage() {
  const [customers, casts, loggedIn] = await Promise.all([
    getCustomers(), getCasts(), isAuthenticated()
  ])

  const activeCasts = casts.filter(c =>
    customers.some(cu => cu.designatedCastIds.includes(c.id))
  )

  const bottlesMap: Record<string, Bottle[]> = {}
  await Promise.all(
    customers.map(async c => {
      bottlesMap[c.id] = await getBottlesByCustomer(c.id)
    })
  )

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* 検索バー */}
      <div
        className="sticky z-30 px-4 py-3"
        style={{
          top: 0,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <CustomerSearch
          customers={customers}
          bottlesMap={bottlesMap}
          castMap={Object.fromEntries(casts.map(c => [c.id, c]))}
        />
      </div>

      {/* キャストフィルター + 顧客リスト */}
      <CastFilterRow
        casts={activeCasts}
        customers={customers}
        bottlesMap={bottlesMap}
      />

      {loggedIn && <Fab href="/customers/new" label="新規顧客" />}
    </div>
  )
}
