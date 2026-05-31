'use client'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface FabProps { href: string; label?: string }

export function Fab({ href, label }: FabProps) {
  return (
    <Link
      href={href}
      className="fixed bottom-24 sm:bottom-8 right-5 z-50 flex items-center gap-2 font-semibold px-4 py-3.5 rounded-2xl transition-all hover:scale-105 active:scale-95"
      style={{
        background: 'var(--accent)',
        color: '#fff',
        boxShadow: '0 8px 24px rgba(232,113,90,0.4)',
      }}
    >
      <Plus className="h-5 w-5" />
      {label && <span className="text-sm">{label}</span>}
    </Link>
  )
}
