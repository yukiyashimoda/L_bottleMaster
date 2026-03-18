import type { Metadata } from 'next'
import { Inter, Audiowide } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { isAuthenticated } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })
const audiowide = Audiowide({ subsets: ['latin'], weight: '400', variable: '--font-audiowide' })

export const metadata: Metadata = {
  title: 'ネオスナックエル ボトル管理アプリ',
  description: 'ネオスナックエル ボトル管理アプリ',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const loggedIn = await isAuthenticated()

  return (
    <html lang="ja">
      <body className={`${inter.className} ${audiowide.variable} bg-stone-50 text-gray-900 min-h-screen`}>
        <Nav isLoggedIn={loggedIn} />
        <main className="pt-14 pb-16 sm:pb-0 max-w-2xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
