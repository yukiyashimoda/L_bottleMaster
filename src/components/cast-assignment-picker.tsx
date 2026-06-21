'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import type { Cast } from '@/types'

interface CastAssignmentPickerProps {
  casts: Cast[]
  designatedIds: string[]
  inStoreIds: string[]
  onDesignatedChange: (ids: string[]) => void
  onInStoreChange: (ids: string[]) => void
  title?: string
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}

export function CastAssignmentPicker({
  casts,
  designatedIds,
  inStoreIds,
  onDesignatedChange,
  onInStoreChange,
  title = '指名キャスト',
}: CastAssignmentPickerProps) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? casts.filter((c) => c.name.includes(query) || c.ruby.includes(query))
    : casts

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-bold text-brand-plum">{title}</h2>
        <p className="mt-1 text-sm text-brand-plum/50">
          キャスト名の右側で本指名・場内を選択します。
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-plum/50" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="キャスト名・ふりがなで検索"
          className="h-14 w-full rounded-lg border border-brand-beige bg-white pl-12 pr-4 text-base text-brand-plum outline-none placeholder:text-brand-plum/45 focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-brand-beige bg-white">
        {filtered.length === 0 ? (
          <p className="px-4 py-5 text-center text-sm text-brand-plum/50">
            該当するキャストがいません
          </p>
        ) : (
          filtered.map((cast) => {
            const designated = designatedIds.includes(cast.id)
            const inStore = inStoreIds.includes(cast.id)

            return (
              <div
                key={cast.id}
                className="flex min-h-[72px] items-center gap-3 border-b border-brand-beige px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-semibold text-brand-plum">
                    {cast.name}
                  </div>
                  <div className="mt-0.5 truncate text-sm text-brand-plum/50">
                    {cast.ruby}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => onDesignatedChange(toggleId(designatedIds, cast.id))}
                    className={`min-h-11 rounded-lg border px-3 text-sm font-bold transition-colors ${
                      designated
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-brand-beige bg-transparent text-brand-plum'
                    }`}
                  >
                    本指名
                  </button>
                  <button
                    type="button"
                    onClick={() => onInStoreChange(toggleId(inStoreIds, cast.id))}
                    className={`min-h-11 rounded-lg border px-3 text-sm font-bold transition-colors ${
                      inStore
                        ? 'border-brand-gold bg-brand-gold text-background'
                        : 'border-brand-beige bg-transparent text-brand-plum'
                    }`}
                  >
                    場内
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
