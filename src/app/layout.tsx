import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Nav } from '@/components/nav'
import { isAuthenticated } from '@/lib/auth'
import { PWARegister } from '@/components/pwa-register'

const doto = localFont({
  src: '../../public/fonts/Doto-Bold.ttf',
  variable: '--font-doto',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'L BOTTLE MASTER',
  description: 'NEO SNACK L ボトルキープ管理',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'L BOTTLE MASTER',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png',   sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const loggedIn = await isAuthenticated()

  return (
    <html lang="ja">
      <head>
        <meta name="theme-color" content="#0D0D14" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${doto.variable} min-h-screen`}>
        <PWARegister />
        <Nav isLoggedIn={loggedIn} />
        <div className="noise-overlay" />
        <main className="relative pb-20 sm:pb-0 max-w-2xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
