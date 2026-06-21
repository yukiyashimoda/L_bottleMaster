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
      {/* ── サイドバーオーバーレイ ── */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
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
          background: 'rgba(8,15,22,0.97)',
          borderLeft: '1px solid rgba(129,236,255,0.12)',
          boxShadow: open ? '-8px 0 32px rgba(0,0,0,0.45)' : 'none',
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
            style={{
              width: 76,
              height: 76,
              borderRadius: 10,
              border: '1px solid rgba(129,236,255,0.2)',
              filter: 'drop-shadow(0 0 8px rgba(129,236,255,0.35))',
            }}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>
              Neo Snack L
            </div>
            <div className="glow-text" style={{ fontSize: 18, fontWeight: 700, color: 'var(--theme-accent)', fontFamily: 'var(--font-doto, monospace)', letterSpacing: '0.12em' }}>
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
                  background: active ? 'rgba(129,236,255,0.08)' : 'transparent',
                  color: active ? 'var(--theme-accent)' : 'var(--text-sub)',
                  border: active ? '1px solid rgba(129,236,255,0.15)' : '1px solid transparent',
                  textShadow: active ? '0 0 8px rgba(129,236,255,0.5)' : 'none',
                  textDecoration: 'none', fontSize: 15, fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={18} strokeWidth={2} fill="none" style={{ flexShrink: 0, filter: active ? 'drop-shadow(0 0 4px rgba(129,236,255,0.8))' : 'none' }} />
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
          minHeight: 72,
          background: 'rgba(8,15,22,0.45)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center',
          paddingBottom: 'env(safe-area-inset-bottom)',
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
                minHeight: 72,
                position: 'relative',
                color: active ? 'var(--theme-accent)' : 'var(--text-muted)',
                filter: active ? 'drop-shadow(0 0 5px rgba(129,236,255,0.7))' : 'none',
              }}
            >
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '25%',
                    width: '50%',
                    height: 2,
                    borderRadius: '0 0 999px 999px',
                    background: 'var(--theme-accent)',
                    boxShadow: '0 0 8px var(--theme-accent)',
                  }}
                />
              )}
              <div
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.15s',
                }}
              >
                <Icon
                  size={active ? 22 : 20}
                  strokeWidth={2}
                  fill="none"
                  style={{ stroke: 'currentColor' }}
                />
                <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: 'currentColor', lineHeight: 1, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
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
