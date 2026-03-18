import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { isAuthenticated } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bottle Master β',
  description: 'ナイトクラブ顧客管理システム',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const loggedIn = await isAuthenticated()

  return (
    <html lang="ja">
      <body className={`${inter.className} bg-stone-50 text-gray-900 min-h-screen`}>
        <Nav isLoggedIn={loggedIn} />
        <main className="pt-14 max-w-2xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
