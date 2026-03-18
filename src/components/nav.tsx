'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogIn, LogOut } from 'lucide-react'
import { FaAddressCard } from 'react-icons/fa'
import { GiAmpleDress } from 'react-icons/gi'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/login/actions'

interface NavProps {
  isLoggedIn: boolean
}

export function Nav({ isLoggedIn }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const links = [
    { href: '/', label: '顧客', Icon: FaAddressCard },
    { href: '/casts', label: 'キャスト', Icon: GiAmpleDress },
  ]

  const handleLogout = async () => {
    await logoutAction()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* トップヘッダー */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-brand-beige h-14 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex flex-col leading-none gap-0.5">
              <span className="text-[9px] font-medium text-brand-plum/50 tracking-widest uppercase">Neo Snack L</span>
              <span className="text-brand-plum text-base" style={{ fontFamily: 'var(--font-audiowide)' }}>Bottle Master Ver１</span>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            {/* PC: 顧客・キャストをヘッダーに表示 */}
            {links.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === href || (href !== '/' && pathname.startsWith(href))
                    ? 'bg-brand-beige text-brand-plum'
                    : 'text-brand-plum/60 hover:text-brand-plum hover:bg-brand-beige'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}

            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-brand-plum/60 hover:text-brand-plum hover:bg-brand-beige transition-colors ml-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-brand-plum/60 hover:text-brand-plum hover:bg-brand-beige transition-colors ml-1"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">ログイン</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* スマホ: 下部固定ナビ */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-beige shadow-lg">
        <div className="flex">
          {links.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors',
                  active ? 'text-brand-plum' : 'text-brand-plum/50'
                )}
              >
                <Icon size={20} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
