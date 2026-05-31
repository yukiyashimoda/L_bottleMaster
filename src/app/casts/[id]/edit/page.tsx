import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCast } from '@/lib/kv'
import { EditCastForm } from './edit-cast-form'

export const dynamic = 'force-dynamic'

export default async function EditCastPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cast = await getCast(id)
  if (!cast) notFound()

  return (
    <div className="min-h-screen pb-10">
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <Link href={`/casts/${id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-bold text-gray-900">キャスト編集</h1>
      </div>

      <div className="px-4 py-5">
        <EditCastForm cast={cast} />
      </div>
    </div>
  )
}
