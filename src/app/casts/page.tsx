import Link from 'next/link'
import { getCasts, getCustomers } from '@/lib/kv'
import { getHiraganaGroup, hiraganaGroups } from '@/lib/utils'
import { HiraganaIndex } from '@/components/hiragana-index'
import { CastSearch } from './cast-search'
import { NewCastFab } from './new-cast-fab'
import { isAuthenticated } from '@/lib/auth'
import { GiAmpleDress } from 'react-icons/gi'

export const dynamic = 'force-dynamic'

export default async function CastListPage() {
  const [casts, customers, loggedIn] = await Promise.all([getCasts(), getCustomers(), isAuthenticated()])

  const customerCounts = new Map<string, number>()
  for (const cast of casts) {
    customerCounts.set(cast.id, customers.filter((c) => c.designatedCastIds.includes(cast.id)).length)
  }

  const grouped = new Map<string, typeof casts>()
  for (const group of hiraganaGroups) {
    const inGroup = casts.filter((c) => getHiraganaGroup(c.ruby) === group)
    if (inGroup.length > 0) {
      grouped.set(group, inGroup)
    }
  }

  const activeGroups = Array.from(grouped.keys())

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="sticky top-0 z-20 px-4 py-3" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid hsl(var(--border))' }}>
        <h1 className="text-xl font-bold text-brand-plum mb-3">キャスト一覧</h1>
        <CastSearch
          casts={casts}
          visitCounts={Object.fromEntries(customerCounts)}
        />
      </div>

      <div className="pb-24">
        {activeGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-brand-plum/50">
            <p className="text-lg">キャストが登録されていません</p>
          </div>
        ) : (
          activeGroups.map((group) => {
            const groupCasts = grouped.get(group)!
            return (
              <div key={group} id={`group-${group}`}>
                <div className="px-4 py-1.5 pt-4">
                  <span className="text-xs font-semibold text-brand-plum/60 uppercase tracking-wider">
                    {group}
                  </span>
                </div>
                {groupCasts.map((cast) => (
                  <Link
                    key={cast.id}
                    href={`/casts/${cast.id}`}
                    className="flex items-center gap-3 px-4 py-3 mx-3 my-1.5 rounded-xl bg-card/80 border border-border transition-all shadow-sm backdrop-blur active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden border border-primary/20">
                      {cast.ruby}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-normal text-brand-plum">{cast.name}</span>
                        {cast.memo && (
                          <span className="text-xs text-brand-plum/50 truncate">{cast.memo}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-brand-plum/60 text-sm shrink-0">
                      <GiAmpleDress size={14} className="text-brand-plum/50" />
                      <span>{customerCounts.get(cast.id) ?? 0} 人</span>
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
