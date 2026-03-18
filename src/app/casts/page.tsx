import Link from 'next/link'
import { getCasts, getVisitRecordsByCast } from '@/lib/kv'
import { getHiraganaGroup, hiraganaGroups } from '@/lib/utils'
import { HiraganaIndex } from '@/components/hiragana-index'
import { CastSearch } from './cast-search'
import { NewCastFab } from './new-cast-fab'
import { isAuthenticated } from '@/lib/auth'
import { Star } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CastListPage() {
  const [casts, loggedIn] = await Promise.all([getCasts(), isAuthenticated()])

  const visitCounts = new Map<string, number>()
  await Promise.all(
    casts.map(async (c) => {
      const visits = await getVisitRecordsByCast(c.id)
      visitCounts.set(c.id, visits.length)
    })
  )

  const grouped = new Map<string, typeof casts>()
  for (const group of hiraganaGroups) {
    const inGroup = casts.filter((c) => getHiraganaGroup(c.ruby) === group)
    if (inGroup.length > 0) {
      grouped.set(group, inGroup)
    }
  }

  const activeGroups = Array.from(grouped.keys())

  return (
    <div className="relative min-h-screen">
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900 mb-3">キャスト一覧</h1>
        <CastSearch
          casts={casts}
          visitCounts={Object.fromEntries(visitCounts)}
        />
      </div>

      <HiraganaIndex activeGroups={activeGroups} />

      <div className="pb-24 pr-8">
        {activeGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-lg">キャストが登録されていません</p>
          </div>
        ) : (
          activeGroups.map((group) => {
            const groupCasts = grouped.get(group)!
            return (
              <div key={group} id={`group-${group}`}>
                <div className="sticky top-[calc(3.5rem+4.5rem)] z-10 bg-stone-50/90 backdrop-blur px-4 py-1.5">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {group}
                  </span>
                </div>
                {groupCasts.map((cast) => (
                  <Link
                    key={cast.id}
                    href={`/casts/${cast.id}`}
                    className="flex items-center gap-3 px-4 py-3 border-b border-stone-200 hover:bg-stone-100 transition-colors"
                  >
                    <div className="px-3 h-9 rounded-xl bg-orange-400 text-white flex items-center justify-center text-xs font-bold shrink-0 min-w-[2.5rem]">
                      {cast.ruby}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{cast.name}</span>
                        {cast.memo && (
                          <span className="text-xs text-gray-400 truncate">{cast.memo}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-sm shrink-0">
                      <Star className="h-3.5 w-3.5 text-gray-400" />
                      <span>{visitCounts.get(cast.id) ?? 0} 指名</span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          })
        )}
      </div>

      {loggedIn && <NewCastFab />}
    </div>
  )
}
