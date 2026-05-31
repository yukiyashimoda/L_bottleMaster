'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogIn, LogOut } from 'lucide-react'
import { FaAddressCard, FaStar } from 'react-icons/fa'
import { GiAmpleDress } from 'react-icons/gi'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/login/actions'

interface NavProps { isLoggedIn: boolean }

export function Nav({ isLoggedIn }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const links = [
    { href: '/',         label: '顧客',      Icon: FaAddressCard },
    { href: '/casts',    label: 'キャスト',  Icon: GiAmpleDress  },
    { href: '/favorites',label: 'お気に入り', Icon: FaStar       },
  ]

  const handleLogout = async () => {
    await logoutAction()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* ヘッダー */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 h-14"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-2xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/">
            <div>
              <div className="text-[8px] tracking-[0.3em] uppercase font-medium" style={{ color: 'var(--accent)' }}>
                Neo Snack L
              </div>
              <div className="text-sm font-semibold tracking-wide" style={{ color: 'var(--text)', fontFamily: 'var(--font-audiowide)' }}>
                Bottle Master
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            {links.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                  isActive(href) ? 'text-white' : 'hover:opacity-80'
                )}
                style={isActive(href)
                  ? { background: 'var(--accent)', color: 'var(--text)' }
                  : { color: 'var(--text-sub)' }
                }
              >
                <Icon size={13} />{label}
              </Link>
            ))}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2 py-2 rounded-xl text-xs transition-all"
                style={{ color: 'var(--text-sub)' }}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-0.5">ログアウト</span>
              </button>
            ) : (
              <Link href="/login" className="flex items-center gap-1 px-2 py-2 rounded-xl text-xs" style={{ color: 'var(--text-sub)' }}>
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline ml-0.5">ログイン</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* スマホ下部ナビ */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 h-16"
        style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}
      >
        <div className="flex h-full">
          {links.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all"
                style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                <Icon size={19} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
