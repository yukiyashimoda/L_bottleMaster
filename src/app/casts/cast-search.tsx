'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, X, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { Cast } from '@/types'

interface CastSearchProps {
  casts: Cast[]
  visitCounts: Record<string, number>
}

export function CastSearch({ casts, visitCounts }: CastSearchProps) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? casts.filter(
        (c) => c.name.includes(query) || c.ruby.includes(query)
      )
    : null

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="名前・ふりがなで検索"
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
              該当するキャストが見つかりません
            </p>
          ) : (
            filtered.map((cast) => (
              <Link
                key={cast.id}
                href={`/casts/${cast.id}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-stone-200 last:border-b-0 hover:bg-stone-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {cast.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{cast.name}</div>
                  <div className="text-xs text-gray-400">{cast.ruby}</div>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Star className="h-3.5 w-3.5 text-gray-400" />
                  <span>{visitCounts[cast.id] ?? 0} 指名</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
