import type { Metadata } from 'next'
import { Kiwi_Maru, Audiowide } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { isAuthenticated } from '@/lib/auth'
import { PWARegister } from '@/components/pwa-register'
import { ThemeProvider } from '@/components/theme-provider'

const kiwiMaru = Kiwi_Maru({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-kiwi-maru' })
const audiowide = Audiowide({ subsets: ['latin'], weight: '400', variable: '--font-audiowide' })

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
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${kiwiMaru.className} ${kiwiMaru.variable} ${audiowide.variable} min-h-screen`}>
        <ThemeProvider>
          <PWARegister />
          <Nav isLoggedIn={loggedIn} />
          <main className="pt-16 pb-20 sm:pb-0 max-w-2xl mx-auto">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
