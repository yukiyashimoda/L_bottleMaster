'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { CustomerCard } from '@/components/customer-card'
import type { Customer, Bottle, Cast } from '@/types'

interface CustomerSearchProps {
  customers: Customer[]
  bottlesMap: Record<string, Bottle[]>
  castMap: Record<string, Cast>
}

export function CustomerSearch({ customers, bottlesMap, castMap }: CustomerSearchProps) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? customers.filter(
        (c) =>
          c.name.includes(query) ||
          c.ruby.includes(query) ||
          c.nickname.includes(query)
      )
    : null

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="名前・ふりがな・ニックネームで検索"
          className="pl-9 pr-9 bg-stone-50 border-stone-200"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered && (
        <div className="mt-2 rounded-lg border border-stone-200 bg-white overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm">
              該当する顧客が見つかりません
            </p>
          ) : (
            filtered.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                bottles={bottlesMap[customer.id] ?? []}
                designatedCastName={
                  customer.designatedCastIds[0]
                    ? castMap[customer.designatedCastIds[0]]?.name
                    : undefined
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
