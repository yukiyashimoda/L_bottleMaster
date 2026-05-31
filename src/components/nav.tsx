'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogIn, LogOut, Sun, Moon } from 'lucide-react'
import { FaAddressCard, FaStar } from 'react-icons/fa'
import { GiAmpleDress } from 'react-icons/gi'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/login/actions'

interface NavProps { isLoggedIn: boolean }

export function Nav({ isLoggedIn }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const links = [
    { href: '/',        label: '顧客',     Icon: FaAddressCard },
    { href: '/casts',   label: 'キャスト', Icon: GiAmpleDress  },
    { href: '/favorites',label: 'お気に入り',Icon: FaStar       },
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
      {/* ── トップヘッダー ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 h-14"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 h-full flex items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex flex-col leading-none">
              <span className="text-[8px] tracking-[0.3em] uppercase" style={{ color: 'var(--gold)' }}>
                Neo Snack L
              </span>
              <span
                className="text-sm font-medium tracking-wide"
                style={{ color: 'var(--text)', fontFamily: 'var(--font-audiowide)' }}
              >
                Bottle Master
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-0.5">
            {/* PC ナビリンク */}
            {links.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  isActive(href)
                    ? 'text-[var(--gold)] bg-[var(--gold-bg)]'
                    : 'text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)]'
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}

            {/* テーマトグル */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg transition-all hover:bg-[var(--bg-elevated)]"
              style={{ color: 'var(--text-sub)' }}
              aria-label="テーマ切替"
            >
              {theme === 'dark'
                ? <Sun  className="h-4 w-4" />
                : <Moon className="h-4 w-4" />
              }
            </button>

            {/* ログイン/アウト */}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all hover:bg-[var(--bg-elevated)]"
                style={{ color: 'var(--text-sub)' }}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all hover:bg-[var(--bg-elevated)]"
                style={{ color: 'var(--text-sub)' }}
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">ログイン</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── スマホ: 下部ナビ ── */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -1px 12px rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex items-center">
          {links.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-medium transition-all"
                style={{ color: active ? 'var(--gold)' : 'var(--text-muted)' }}
              >
                <Icon size={18} />
                {label}
                {active && (
                  <span
                    className="absolute bottom-0 w-8 h-0.5 rounded-full"
                    style={{ background: 'var(--gold)' }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
