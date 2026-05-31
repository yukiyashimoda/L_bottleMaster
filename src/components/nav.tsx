'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, Sparkles, Star, LogOut, X } from 'lucide-react'
import { logoutAction } from '@/app/login/actions'

const LINKS = [
  { href: '/',           label: '顧客',      Icon: Users    },
  { href: '/casts',      label: 'キャスト',  Icon: Sparkles },
  { href: '/favorites',  label: 'お気に入り', Icon: Star     },
]

export function Nav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const handleLogout = async () => {
    await logoutAction()
    router.push('/')
    router.refresh()
    setOpen(false)
  }

  return (
    <>
      {/* ── 右上 丸型アイコンボタン ── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="メニューを開く"
        style={{
          position: 'fixed', top: 12, right: 12, zIndex: 50,
          width: 40, height: 40, borderRadius: '50%',
          overflow: 'hidden', padding: 0, cursor: 'pointer',
          border: '2px solid var(--border)',
          boxShadow: 'var(--shadow)',
          background: 'var(--bg-surface)',
        }}
      >
        <img src="/apple-touch-icon.png" alt="app" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </button>

      {/* ── サイドバーオーバーレイ ── */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.4)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s',
        }}
      />

      {/* ── サイドバーパネル ── */}
      <aside
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 70,
          width: 260,
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column',
          padding: '16px 16px 32px',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* 閉じるボタン */}
        <button
          onClick={() => setOpen(false)}
          style={{
            alignSelf: 'flex-end', background: 'none', border: 'none',
            cursor: 'pointer', padding: 8, borderRadius: 8,
            color: 'var(--text-muted)',
          }}
        >
          <X size={18} />
        </button>

        {/* アプリアイコン + 名前 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 0 28px' }}>
          <img
            src="/apple-touch-icon.png"
            alt="L Bottle Master"
            style={{ width: 76, height: 76, borderRadius: '50%', border: '2px solid var(--border)' }}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 2 }}>
              Neo Snack L
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-audiowide)' }}>
              Bottle Master
            </div>
          </div>
        </div>

        {/* ナビリンク */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {LINKS.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 12,
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#fff' : 'var(--accent)',
                  textDecoration: 'none', fontSize: 15, fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={18} strokeWidth={active ? 0 : 2} fill={active ? '#fff' : 'none'} style={{ flexShrink: 0 }} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* ログアウト */}
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 12,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 15, fontWeight: 500,
            }}
          >
            <LogOut size={18} style={{ stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 2 }} />
            ログアウト
          </button>
        )}
      </aside>

      {/* ── 下部ナビ（スマホ） ── */}
      <nav
        className="sm:hidden"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          height: 64,
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
        }}
      >
        {LINKS.map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 3,
                  padding: active ? '5px 18px' : '5px 8px',
                  borderRadius: 20,
                  background: active ? 'var(--accent)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 0 : 2}
                  fill={active ? '#fff' : 'none'}
                  style={{ stroke: active ? 'none' : 'var(--accent)' }}
                />
                <span style={{ fontSize: 10, fontWeight: 600, color: active ? '#fff' : 'var(--accent)', lineHeight: 1 }}>
                  {label}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
