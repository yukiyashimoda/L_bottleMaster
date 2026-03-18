'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createCastAction } from './actions'

export function NewCastFab() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [ruby, setRuby] = useState('')
  const [memo, setMemo] = useState('')

  const handleClose = () => {
    setOpen(false)
    setError('')
    setName('')
    setRuby('')
    setMemo('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await createCastAction({ name, ruby, memo })
    setLoading(false)
    if (result.success) {
      handleClose()
      router.refresh()
    } else {
      setError(result.error ?? '登録に失敗しました')
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-gray-900 text-white shadow-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
        aria-label="キャストを追加"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative z-50 w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gray-500" />
                <h2 className="font-bold text-gray-900">キャストを追加</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-gray-700">
                  源氏名<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="桜"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-700">
                  ふりがな<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  value={ruby}
                  onChange={(e) => setRuby(e.target.value)}
                  placeholder="さくら"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-700">メモ</Label>
                <Textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="出勤曜日、担当など"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-700 text-white font-bold h-11"
              >
                {loading ? '登録中...' : 'キャストを登録する'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
