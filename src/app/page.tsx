import { getCustomers, getBottlesByCustomer, getCasts } from '@/lib/kv'
import { CustomerView } from '@/components/customer-view'
import { Fab } from '@/components/fab'
import { isAuthenticated } from '@/lib/auth'
import type { Bottle } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CustomerListPage() {
  const [customers, casts, loggedIn] = await Promise.all([
    getCustomers(), getCasts(), isAuthenticated()
  ])

  const bottlesMap: Record<string, Bottle[]> = {}
  await Promise.all(customers.map(async c => {
    bottlesMap[c.id] = await getBottlesByCustomer(c.id)
  }))

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg)' }}>
      <CustomerView
        customers={customers}
        casts={casts}
        bottlesMap={bottlesMap}
        loggedIn={loggedIn}
      />
      {loggedIn && <Fab href="/customers/new" label="新規顧客" />}
    </div>
  )
}
