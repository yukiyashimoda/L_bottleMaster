'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Search, X, Plus, UserPlus } from 'lucide-react'
import { GiBrandyBottle } from 'react-icons/gi'
import { CastAssignmentPicker } from '@/components/cast-assignment-picker'
import { createVisitAction } from './actions'
import type { Cast, Bottle, Customer } from '@/types'

interface NewVisitFormProps {
  customerId: string
  casts: Cast[]
  existingBottles: Bottle[]
  defaultDesignatedCastIds: string[]
  allCustomers: Customer[]
  defaultLinkedCustomerIds: string[]
}

interface BottleRow {
  id: string          // 既存ボトルのID or 'new-{timestamp}'
  name: string
  remaining: number   // 0〜100（5刻み）
  openedDate: string
  isNew: boolean
}

function percentToNum(remaining: string | number): number {
  const raw = typeof remaining === 'number' ? remaining : Number(String(remaining).replace('%', '').trim())
  if (Number.isNaN(raw)) return 100

  const percent = raw <= 1 ? raw * 100 : raw
  return Math.min(100, Math.max(0, Math.round(percent / 5) * 5))
}

function remainingColor(v: number): string {
  if (v === 0) return 'text-brand-coral'
  if (v <= 30) return 'text-brand-plum/50'
  if (v <= 60) return 'text-brand-plum/80'
  return 'text-brand-plum'
}

const today = new Date().toISOString().split('T')[0]

export function NewVisitForm({
  customerId,
  casts,
  existingBottles,
  defaultDesignatedCastIds,
  allCustomers,
  defaultLinkedCustomerIds,
}: NewVisitFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [designatedCastIds, setDesignatedCastIds] = useState<string[]>(defaultDesignatedCastIds)
  const [inStoreCastIds, setInStoreCastIds] = useState<string[]>([])
  const [castPickerOpen, setCastPickerOpen] = useState(false)
  const [linkedCustomerIds, setLinkedCustomerIds] = useState<string[]>(defaultLinkedCustomerIds)
  const [linkedQuery, setLinkedQuery] = useState('')
  const [isAlert, setIsAlert] = useState(false)
  const [alertReason, setAlertReason] = useState('')
  const [bottles, setBottles] = useState<BottleRow[]>(
    existingBottles.map((b) => ({
      id: b.id,
      name: b.name,
      remaining: percentToNum(b.remaining),
      openedDate: b.openedDate.split('T')[0],
      isNew: false,
    }))
  )

  const addBottle = () => {
    setBottles((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, name: '', remaining: 100, openedDate: today, isNew: true },
    ])
  }

  const selectedDesignatedCasts = designatedCastIds
    .map((id) => casts.find((c) => c.id === id))
    .filter(Boolean)
  const selectedInStoreCasts = inStoreCastIds
    .map((id) => casts.find((c) => c.id === id))
    .filter(Boolean)

  const removeBottle = (id: string) => {
    setBottles((prev) => prev.filter((b) => b.id !== id))
  }

  const updateField = (id: string, field: 'name' | 'remaining' | 'openedDate', value: string | number) => {
    setBottles((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const formData = new FormData(form)
    const visitDate = new Date(formData.get('visitDate') as string).toISOString()

    const result = await createVisitAction({
      customerId,
      visitDate,
      designatedCastIds,
      inStoreCastIds,
      bottleUpdates: bottles
        .filter((b) => !b.isNew)
        .map((b) => ({ id: b.id, remaining: `${b.remaining}%` })),
      newBottles: bottles
        .filter((b) => b.isNew && b.name.trim())
        .map((b) => ({
          name: b.name,
          remaining: `${b.remaining}%`,
          openedDate: visitDate,
        })),
      memo: formData.get('memo') as string,
      linkedCustomerIds,
      isAlert,
      alertReason: isAlert ? alertReason : '',
    })

    setLoading(false)
    if (result.success) {
      router.push(`/customers/${customerId}`)
    } else {
      setError(result.error ?? '登録に失敗しました')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="touch-form space-y-5 pb-28">
      {error && (
        <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-brand-plum">
          来店日<span className="text-brand-coral ml-0.5">*</span>
        </Label>
        <Input name="visitDate" type="date" required defaultValue={today} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-brand-plum">指名キャスト</Label>
          <button
            type="button"
            onClick={() => setCastPickerOpen(true)}
            className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 text-sm font-bold text-primary"
          >
            <UserPlus className="h-4 w-4" />
            追加
          </button>
        </div>

        <div className="rounded-xl border border-brand-beige bg-white p-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-bold text-brand-plum/60">本指名</p>
              <p className="mt-1 text-base font-semibold text-brand-plum">
                {selectedDesignatedCasts.length > 0
                  ? selectedDesignatedCasts.map((c) => c!.name).join('・')
                  : '未選択'}
              </p>
            </div>
            <div className="border-t border-brand-beige pt-3">
              <p className="text-sm font-bold text-brand-plum/60">場内</p>
              <p className="mt-1 text-base font-semibold text-brand-plum">
                {selectedInStoreCasts.length > 0
                  ? selectedInStoreCasts.map((c) => c!.name).join('・')
                  : '未選択'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {castPickerOpen && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setCastPickerOpen(false)}
          />
          <div className="relative z-[91] max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-brand-beige bg-card p-4 shadow-2xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">CAST</p>
                <h2 className="text-lg font-bold text-brand-plum">指名キャストを追加</h2>
              </div>
              <button
                type="button"
                onClick={() => setCastPickerOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-brand-plum/70"
                aria-label="閉じる"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <CastAssignmentPicker
              casts={casts}
              designatedIds={designatedCastIds}
              inStoreIds={inStoreCastIds}
              onDesignatedChange={setDesignatedCastIds}
              onInStoreChange={setInStoreCastIds}
              title="キャスト一覧"
            />

            <div className="sticky bottom-0 -mx-4 mt-4 border-t border-brand-beige bg-card/95 px-4 py-3 backdrop-blur">
              <Button
                type="button"
                className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setCastPickerOpen(false)}
              >
                選択を反映する
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* キープボトル */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-brand-plum">
            キープボトル
            {bottles.length > 0 && (
              <span className="ml-2 text-xs text-brand-plum/60">{bottles.length}本</span>
            )}
          </Label>
          <button
            type="button"
            onClick={addBottle}
            className="flex items-center gap-1 text-sm text-brand-plum hover:text-brand-plum font-medium"
          >
            <Plus className="h-4 w-4" />
            追加
          </button>
        </div>

        {bottles.length === 0 && (
          <p className="text-xs text-brand-plum/50 py-1">キープボトルはありません</p>
        )}

        <div className="space-y-3">
          {bottles.map((bottle) => (
            <div key={bottle.id} className="rounded-lg border border-brand-beige bg-white p-3 space-y-3">
              <div className="flex items-center gap-2">
                <GiBrandyBottle size={16} className="text-brand-plum/60 shrink-0" />
                {bottle.isNew ? (
                  <Input
                    value={bottle.name}
                    onChange={(e) => updateField(bottle.id, 'name', e.target.value)}
                    placeholder="ボトル名（例：山崎12年）"
                    className="flex-1 h-8 text-sm"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium text-brand-plum truncate">
                    {bottle.name}
                  </span>
                )}
                {bottle.isNew && (
                  <button
                    type="button"
                    onClick={() => removeBottle(bottle.id)}
                    className="text-brand-plum/50 hover:text-brand-coral shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* 残量スライダー */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-plum/60">残量</span>
                  <span className={`text-sm font-bold tabular-nums ${remainingColor(bottle.remaining)}`}>
                    {bottle.remaining}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={bottle.remaining}
                    onChange={(e) => updateField(bottle.id, 'remaining', Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-plum"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--brand-plum)) 0%, hsl(var(--brand-plum)) ${bottle.remaining}%, hsl(var(--brand-beige)) ${bottle.remaining}%, hsl(var(--brand-beige)) 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-brand-plum/50">0%</span>
                    <span className="text-[10px] text-brand-plum/50">50%</span>
                    <span className="text-[10px] text-brand-plum/50">100%</span>
                  </div>
                </div>
              </div>

              {/* 開封日（新規ボトルのみ） */}
              {bottle.isNew && (
                <div className="space-y-1">
                  <span className="text-xs text-brand-plum/60">開封日</span>
                  <Input
                    type="date"
                    value={bottle.openedDate}
                    onChange={(e) => updateField(bottle.id, 'openedDate', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 同伴者・グループ */}
      {allCustomers.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-brand-plum">
            同伴者・グループ客
            {linkedCustomerIds.length > 0 && (
              <span className="ml-2 text-xs text-brand-plum/60">{linkedCustomerIds.length}名選択中</span>
            )}
          </Label>
          <div className="rounded-lg border border-brand-beige bg-white overflow-hidden">
            {linkedCustomerIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-brand-beige">
                {linkedCustomerIds.map((lid) => {
                  const c = allCustomers.find((x) => x.id === lid)
                  if (!c) return null
                  return (
                    <span key={lid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-xs text-brand-plum">
                      {c.name}
                      <button
                        type="button"
                        onClick={() => setLinkedCustomerIds((prev) => prev.filter((x) => x !== lid))}
                        className="text-brand-plum/60 hover:text-brand-plum"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-plum/50" />
              <input
                type="text"
                value={linkedQuery}
                onChange={(e) => setLinkedQuery(e.target.value)}
                placeholder="名前・ふりがな・ニックネームで検索"
                className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-0 outline-none text-brand-plum placeholder:text-brand-plum/50"
              />
            </div>
            <div className="max-h-40 overflow-y-auto border-t border-brand-beige">
              {(() => {
                const filtered = linkedQuery.trim()
                  ? allCustomers.filter((c) =>
                      c.name.includes(linkedQuery) ||
                      c.ruby.includes(linkedQuery) ||
                      c.nickname.includes(linkedQuery)
                    )
                  : allCustomers
                return filtered.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-brand-plum/50">該当する顧客がいません</p>
                ) : (
                  filtered.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                        linkedCustomerIds.includes(c.id) ? 'bg-white' : 'hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={linkedCustomerIds.includes(c.id)}
                        onChange={() =>
                          setLinkedCustomerIds((prev) =>
                            prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                          )
                        }
                        className="accent-brand-plum"
                      />
                      <span className="text-sm text-brand-plum">{c.name}</span>
                      <span className="text-xs text-brand-plum/50">({c.ruby})</span>
                    </label>
                  ))
                )
              })()}
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-lg border transition-colors ${isAlert ? 'border-brand-coral/40 bg-brand-coral/10' : 'border-brand-beige bg-white'}`}>
        <div className="flex items-center gap-3 p-3">
          <button
            type="button"
            onClick={() => setIsAlert((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${isAlert ? 'bg-brand-coral' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isAlert ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <Label className="text-brand-plum cursor-pointer" onClick={() => setIsAlert((v) => !v)}>
            要注意フラグ
            {isAlert && <span className="ml-2 text-brand-coral text-xs font-normal">（要注意バッジが表示されます）</span>}
          </Label>
        </div>
        {isAlert && (
          <div className="px-3 pb-3">
            <textarea
              value={alertReason}
              onChange={(e) => setAlertReason(e.target.value)}
              placeholder="要注意の理由を入力（例：無断キャンセル、支払いトラブルなど）"
              rows={3}
              className="w-full text-sm rounded-md border border-brand-coral/40 bg-white px-3 py-2 text-brand-plum placeholder:text-brand-plum/50 outline-none focus:ring-1 focus:ring-brand-coral/40 resize-none"
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-brand-plum">メモ</Label>
        <Textarea name="memo" placeholder="特記事項など" rows={3} />
      </div>

      <div className="form-action-bar fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-brand-beige px-4 py-3 max-w-2xl mx-auto">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11"
        >
          {loading ? '記録中...' : '来店を記録する'}
        </Button>
      </div>
    </form>
  )
}
