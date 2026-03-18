'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, User, AlertTriangle, X, Edit, Trash2, ChevronRight } from 'lucide-react'
import { GiBrandyBottle } from 'react-icons/gi'
import { formatDate } from '@/lib/utils'
import type { VisitRecord, Cast, Bottle } from '@/types'
import { updateVisitAction, deleteVisitAction } from '@/lib/visit-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface VisitCardProps {
  visit: VisitRecord
  casts: Cast[]
  bottles: Bottle[]
  loggedIn?: boolean
}

type ModalMode = 'view' | 'edit' | 'delete'

export function VisitCard({ visit, casts, bottles, loggedIn }: VisitCardProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<ModalMode>('view')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')

  const [editDate, setEditDate] = useState(visit.visitDate.split('T')[0])
  const [editMemo, setEditMemo] = useState(visit.memo)
  const [editIsAlert, setEditIsAlert] = useState(visit.isAlert ?? false)
  const [editAlertReason, setEditAlertReason] = useState(visit.alertReason ?? '')
  const [editDesignatedCastIds, setEditDesignatedCastIds] = useState<string[]>(visit.designatedCastIds)
  const [editInStoreCastIds, setEditInStoreCastIds] = useState<string[]>(visit.inStoreCastIds)

  const castMap = new Map(casts.map((c) => [c.id, c]))
  const designatedCasts = visit.designatedCastIds.map((id) => castMap.get(id)).filter(Boolean)
  const inStoreCasts = visit.inStoreCastIds.map((id) => castMap.get(id)).filter(Boolean)

  const bottleMap = new Map(bottles.map((b) => [b.id, b]))
  const openedBottles = visit.bottlesOpened.map((id) => bottleMap.get(id)).filter(Boolean) as Bottle[]
  const usedBottles = visit.bottlesUsed.map((id) => bottleMap.get(id)).filter(Boolean) as Bottle[]

  const isAlert = visit.isAlert ?? false
  const whiteStyle = isAlert ? { color: 'white' } : {}

  function openModal() {
    setMode('view')
    setError('')
    setIsOpen(true)
  }

  function closeModal() {
    setIsOpen(false)
    setError('')
    setPassword('')
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await updateVisitAction(visit.id, {
      visitDate: new Date(editDate).toISOString(),
      memo: editMemo,
      isAlert: editIsAlert,
      alertReason: editIsAlert ? editAlertReason : '',
      designatedCastIds: editDesignatedCastIds,
      inStoreCastIds: editInStoreCastIds,
    })
    setLoading(false)
    if (result.success) {
      closeModal()
      router.refresh()
    } else {
      setError(result.error ?? '更新に失敗しました')
    }
  }

  async function handleDelete() {
    setLoading(true)
    setError('')
    const result = await deleteVisitAction(visit.id, password)
    setLoading(false)
    if (result.success) {
      closeModal()
      router.refresh()
    } else {
      setError(result.error ?? '削除に失敗しました')
    }
  }

  function toggleCast(id: string, type: 'designated' | 'inStore') {
    if (type === 'designated') {
      setEditDesignatedCastIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      )
    } else {
      setEditInStoreCastIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      )
    }
  }

  return (
    <>
      <div
        onClick={openModal}
        className={`rounded-xl border p-4 space-y-3 shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${
          isAlert ? 'border-red-800 bg-red-700' : 'border-stone-200 bg-white'
        }`}
      >
        <div className="flex items-center gap-2 font-semibold" style={whiteStyle}>
          {isAlert && <AlertTriangle className="h-4 w-4 shrink-0" />}
          <Calendar className="h-4 w-4" />
          <span>{formatDate(visit.visitDate)}</span>
          <ChevronRight className="h-4 w-4 ml-auto opacity-40" />
        </div>

        {(designatedCasts.length > 0 || inStoreCasts.length > 0) && (
          <div className="flex flex-wrap gap-3 text-sm" style={whiteStyle}>
            {designatedCasts.length > 0 && (
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span className={isAlert ? '' : 'text-gray-400'}>本指名:</span>
                <span className="font-medium">{designatedCasts.map((c) => c!.name).join('・')}</span>
              </div>
            )}
            {inStoreCasts.length > 0 && (
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 opacity-60" />
                <span className={isAlert ? '' : 'text-gray-400'}>場内:</span>
                <span>{inStoreCasts.map((c) => c!.name).join('・')}</span>
              </div>
            )}
          </div>
        )}

        {openedBottles.length > 0 && (
          <div className="text-sm flex items-center gap-1.5" style={whiteStyle}>
            <GiBrandyBottle size={14} />
            <span className={isAlert ? '' : 'text-gray-400'}>開封:</span>
            <span>{openedBottles.map((b) => b.name).join(', ')}</span>
          </div>
        )}
        {usedBottles.length > 0 && (
          <div className="text-sm flex items-center gap-1.5" style={whiteStyle}>
            <GiBrandyBottle size={14} style={{ opacity: 0.6 }} />
            <span className={isAlert ? '' : 'text-gray-400'}>使用:</span>
            <span>{usedBottles.map((b) => b.name).join(', ')}</span>
          </div>
        )}

        {visit.memo && (
          <p
            className={`text-sm border-t pt-2 ${isAlert ? 'border-red-600' : 'border-stone-100 text-gray-500'}`}
            style={whiteStyle}
          >
            {visit.memo}
          </p>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-2">
              {mode === 'view' && (
                <>
                  <div className="flex items-center gap-2 font-semibold text-gray-900 flex-1 min-w-0">
                    <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                    <span className="truncate">{formatDate(visit.visitDate)}</span>
                    {isAlert && <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />}
                  </div>
                  {loggedIn && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setMode('edit')}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setMode('delete')}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-stone-100 text-gray-500">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
              {mode === 'edit' && (
                <>
                  <span className="font-semibold text-gray-900 flex-1">来店記録を編集</span>
                  <button onClick={() => { setMode('view'); setError('') }} className="p-1.5 rounded-lg hover:bg-stone-100 text-gray-500">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
              {mode === 'delete' && (
                <>
                  <span className="font-semibold text-red-600 flex-1">来店記録を削除</span>
                  <button onClick={() => { setMode('view'); setError('') }} className="p-1.5 rounded-lg hover:bg-stone-100 text-gray-500">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            <div className="p-4">
              {/* View */}
              {mode === 'view' && (
                <div className="space-y-3 text-sm">
                  {isAlert && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-700">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="whitespace-pre-wrap">{visit.alertReason ? visit.alertReason : '要注意フラグあり'}</span>
                    </div>
                  )}
                  {designatedCasts.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 w-16 shrink-0">本指名</span>
                      <span className="text-gray-900">{designatedCasts.map((c) => c!.name).join('・')}</span>
                    </div>
                  )}
                  {inStoreCasts.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 w-16 shrink-0">場内</span>
                      <span className="text-gray-900">{inStoreCasts.map((c) => c!.name).join('・')}</span>
                    </div>
                  )}
                  {openedBottles.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 w-16 shrink-0">開封</span>
                      <span className="text-gray-900">{openedBottles.map((b) => b.name).join(', ')}</span>
                    </div>
                  )}
                  {usedBottles.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 w-16 shrink-0">使用</span>
                      <span className="text-gray-900">{usedBottles.map((b) => b.name).join(', ')}</span>
                    </div>
                  )}
                  {visit.memo && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 w-16 shrink-0">メモ</span>
                      <span className="text-gray-900 whitespace-pre-wrap">{visit.memo}</span>
                    </div>
                  )}
                  {!loggedIn && (
                    <p className="text-xs text-gray-400 pt-2 text-center">編集・削除にはログインが必要です</p>
                  )}
                </div>
              )}

              {/* Edit */}
              {mode === 'edit' && (
                <form onSubmit={handleEdit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
                  )}
                  <div className="space-y-1.5">
                    <Label>来店日</Label>
                    <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <Label>本指名キャスト</Label>
                    <div className="rounded-lg border border-stone-200 bg-stone-50 max-h-36 overflow-y-auto">
                      {casts.map((cast) => (
                        <label key={cast.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${editDesignatedCastIds.includes(cast.id) ? 'bg-gray-100' : 'hover:bg-stone-100'}`}>
                          <input type="checkbox" checked={editDesignatedCastIds.includes(cast.id)} onChange={() => toggleCast(cast.id, 'designated')} className="accent-gray-800" />
                          <span className="text-sm text-gray-800">{cast.name}</span>
                          <span className="text-xs text-gray-400">（{cast.ruby}）</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>場内指名キャスト</Label>
                    <div className="rounded-lg border border-stone-200 bg-stone-50 max-h-36 overflow-y-auto">
                      {casts.map((cast) => (
                        <label key={cast.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${editInStoreCastIds.includes(cast.id) ? 'bg-gray-100' : 'hover:bg-stone-100'}`}>
                          <input type="checkbox" checked={editInStoreCastIds.includes(cast.id)} onChange={() => toggleCast(cast.id, 'inStore')} className="accent-gray-800" />
                          <span className="text-sm text-gray-800">{cast.name}</span>
                          <span className="text-xs text-gray-400">（{cast.ruby}）</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-lg border transition-colors ${editIsAlert ? 'border-orange-200 bg-orange-50' : 'border-stone-200 bg-stone-50'}`}>
                    <div className="flex items-center gap-3 p-3">
                      <button
                        type="button"
                        onClick={() => setEditIsAlert((v) => !v)}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${editIsAlert ? 'bg-orange-400' : 'bg-stone-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${editIsAlert ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      <Label className="text-gray-700 cursor-pointer" onClick={() => setEditIsAlert((v) => !v)}>
                        要注意フラグ
                        {editIsAlert && <span className="ml-2 text-orange-500 text-xs font-normal">（要注意バッジが表示されます）</span>}
                      </Label>
                    </div>
                    {editIsAlert && (
                      <div className="px-3 pb-3">
                        <textarea
                          value={editAlertReason}
                          onChange={(e) => setEditAlertReason(e.target.value)}
                          placeholder="要注意の理由を入力（例：無断キャンセル、支払いトラブルなど）"
                          rows={3}
                          className="w-full text-sm rounded-md border border-orange-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-300 resize-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>メモ</Label>
                    <Textarea value={editMemo} onChange={(e) => setEditMemo(e.target.value)} rows={3} />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-gray-900 hover:bg-gray-700 text-white font-bold h-11">
                    {loading ? '更新中...' : '更新する'}
                  </Button>
                </form>
              )}

              {/* Delete */}
              {mode === 'delete' && (
                <div className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
                  )}
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{formatDate(visit.visitDate)}</span> の来店記録を削除しますか？この操作は元に戻せません。
                  </p>
                  <div className="space-y-1.5">
                    <Label>パスワード</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="削除パスワード"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setMode('view'); setError('') }} className="flex-1">
                      キャンセル
                    </Button>
                    <Button
                      onClick={handleDelete}
                      disabled={loading || !password}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {loading ? '削除中...' : '削除する'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
