'use client'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface FabProps { href: string; label?: string }

export function Fab({ href, label }: FabProps) {
  return (
    <Link
      href={href}
      className="fixed bottom-24 sm:bottom-8 right-5 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-95"
      aria-label={label ?? '追加'}
    >
      <Plus className="h-6 w-6" />
    </Link>
  )
}
