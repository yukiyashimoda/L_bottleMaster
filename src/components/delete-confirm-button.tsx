'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DeleteConfirmButtonProps {
  action: (password: string) => Promise<{ success: boolean; error?: string }>
  redirectTo: string
  itemName: string
}

export function DeleteConfirmButton({ action, redirectTo, itemName }: DeleteConfirmButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    setOpen(false)
    setPassword('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await action(password)
    setLoading(false)
    if (result.success) {
      handleClose()
      router.push(redirectTo)
      router.refresh()
    } else {
      setError(result.error ?? '削除に失敗しました')
      setPassword('')
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        削除
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
          <div className="relative z-50 w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="font-bold text-gray-900">削除の確認</h2>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">「{itemName}」</span> を削除します。
              この操作は取り消せません。
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-gray-700">
                  パスワードを入力して確認
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワード"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !password}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? '削除中...' : '削除する'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
