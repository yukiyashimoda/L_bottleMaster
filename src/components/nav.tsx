'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, Star, BottleWine, LogIn, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/login/actions'

interface NavProps {
  isLoggedIn: boolean
}

export function Nav({ isLoggedIn }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const links = [
    { href: '/', label: '顧客', icon: Users },
    { href: '/casts', label: 'キャスト', icon: Star },
  ]

  const handleLogout = async () => {
    await logoutAction()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-stone-200 h-14 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <BottleWine className="h-5 w-5 text-gray-700" />
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-[9px] font-medium text-gray-400 tracking-widest uppercase">Neo Snack L</span>
            <span className="font-bold text-gray-900 text-base tracking-wide">Bottle Master β</span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === href || (href !== '/' && pathname.startsWith(href))
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-stone-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-stone-100 transition-colors ml-1"
            >
              <LogOut className="h-4 w-4" />
              ログアウト
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-stone-100 transition-colors ml-1"
            >
              <LogIn className="h-4 w-4" />
              ログイン
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
