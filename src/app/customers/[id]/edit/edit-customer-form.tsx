'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Search, X, Plus } from 'lucide-react'
import { GiBrandyBottle } from 'react-icons/gi'
import { updateCustomerAction } from './actions'
import type { Cast, Customer, Bottle } from '@/types'

interface EditCustomerFormProps {
  customer: Customer
  casts: Cast[]
  otherCustomers: Customer[]
  existingBottles: Bottle[]
}

interface BottleRow {
  id: string        // 既存ボトルのID（新規は 'new-{idx}'）
  name: string
  remaining: number // 0〜100（5刻み）
  openedDate: string
  isNew: boolean
  deleted: boolean
}

function percentToNum(remaining: string): number {
  const n = parseInt(remaining)
  return isNaN(n) ? 100 : Math.round(n / 5) * 5
}

function remainingColor(v: number): string {
  if (v === 0) return 'text-red-500'
  if (v <= 30) return 'text-gray-400'
  if (v <= 60) return 'text-gray-600'
  return 'text-gray-900'
}

const today = new Date().toISOString().split('T')[0]

function CastMultiSelect({
  label,
  casts,
  selectedIds,
  onChange,
}: {
  label: string
  casts: Cast[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? casts.filter((c) => c.name.includes(query) || c.ruby.includes(query))
    : casts

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    )
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-gray-700">{label}</Label>
      <div className="rounded-lg border border-stone-200 bg-stone-50 overflow-hidden">
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-stone-200">
            {selectedIds.map((id) => {
              const c = casts.find((x) => x.id === id)
              if (!c) return null
              return (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-200 text-xs text-gray-800">
                  {c.name}
                  <button type="button" onClick={() => toggle(id)} className="text-gray-500 hover:text-gray-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名前・ふりがなで検索"
            className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-0 outline-none text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <div className="max-h-36 overflow-y-auto border-t border-stone-200">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">該当するキャストがいません</p>
          ) : (
            filtered.map((cast) => (
              <label
                key={cast.id}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
                  ${selectedIds.includes(cast.id) ? 'bg-gray-100' : 'hover:bg-stone-100'}`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(cast.id)}
                  onChange={() => toggle(cast.id)}
                  className="accent-gray-800"
                />
                <span className="text-sm text-gray-800">{cast.name}</span>
                <span className="text-xs text-gray-400">（{cast.ruby}）</span>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function EditCustomerForm({
  customer,
  casts,
  otherCustomers,
  existingBottles,
}: EditCustomerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAlert, setIsAlert] = useState(customer.isAlert)
  const [alertReason, setAlertReason] = useState(customer.alertReason ?? '')
  const [designatedCastIds, setDesignatedCastIds] = useState<string[]>(
    customer.designatedCastIds ?? []
  )
  const [linkedIds, setLinkedIds] = useState<string[]>(customer.linkedCustomerIds)
  const [linkedQuery, setLinkedQuery] = useState('')
  const [bottles, setBottles] = useState<BottleRow[]>(
    existingBottles.map((b) => ({
      id: b.id,
      name: b.name,
      remaining: percentToNum(b.remaining),
      openedDate: b.openedDate.split('T')[0],
      isNew: false,
      deleted: false,
    }))
  )

  const filteredCustomers = linkedQuery.trim()
    ? otherCustomers.filter(
        (c) =>
          c.name.includes(linkedQuery) ||
          c.ruby.includes(linkedQuery) ||
          c.nickname.includes(linkedQuery)
      )
    : otherCustomers

  const toggleLinked = (id: string) => {
    setLinkedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const addBottle = () => {
    setBottles((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, name: '', remaining: 100, openedDate: today, isNew: true, deleted: false },
    ])
  }

  const removeBottle = (id: string) => {
    setBottles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, deleted: true } : b))
    )
  }

  const updateBottleField = (id: string, field: 'name' | 'remaining' | 'openedDate', value: string | number) => {
    setBottles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    )
  }

  const visibleBottles = bottles.filter((b) => !b.deleted)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)

    const result = await updateCustomerAction(
      customer.id,
      {
        name: data.get('name') as string,
        ruby: data.get('ruby') as string,
        nickname: data.get('nickname') as string,
        designatedCastIds,
        isAlert,
        alertReason: isAlert ? alertReason : '',
        memo: data.get('memo') as string,
        linkedCustomerIds: linkedIds,
      },
      bottles
        .filter((b) => !b.isNew && !b.deleted && b.name.trim())
        .map((b) => ({ id: b.id, name: b.name, remaining: `${b.remaining}%` })),
      bottles
        .filter((b) => b.isNew && !b.deleted && b.name.trim())
        .map((b) => ({
          name: b.name,
          remaining: `${b.remaining}%`,
          openedDate: new Date(b.openedDate).toISOString(),
        })),
      bottles.filter((b) => !b.isNew && b.deleted).map((b) => b.id)
    )

    setLoading(false)
    if (result.success) {
      router.push(`/customers/${customer.id}`)
    } else {
      setError(result.error ?? '更新に失敗しました')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-gray-700">氏名（漢字）<span className="text-red-500 ml-0.5">*</span></Label>
        <Input name="name" required defaultValue={customer.name} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-gray-700">ふりがな<span className="text-red-500 ml-0.5">*</span></Label>
        <Input name="ruby" required defaultValue={customer.ruby} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-gray-700">ニックネーム</Label>
        <Input name="nickname" defaultValue={customer.nickname} />
      </div>

      <CastMultiSelect
        label="本指名キャスト"
        casts={casts}
        selectedIds={designatedCastIds}
        onChange={setDesignatedCastIds}
      />

      <div className="space-y-1.5">
        <Label className="text-gray-700">特記事項・メモ</Label>
        <Textarea name="memo" defaultValue={customer.memo} rows={3} />
      </div>

      {/* 要注意フラグ */}
      <div className={`rounded-lg border transition-colors ${isAlert ? 'border-red-200 bg-red-50' : 'border-stone-200 bg-stone-50'}`}>
        <div className="flex items-center gap-3 p-3">
          <button
            type="button"
            onClick={() => setIsAlert(!isAlert)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${isAlert ? 'bg-red-500' : 'bg-stone-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isAlert ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <Label className="text-gray-700 cursor-pointer" onClick={() => setIsAlert(!isAlert)}>
            要注意フラグ
            {isAlert && <span className="ml-2 text-red-500 text-xs font-normal">（要確認バッジが表示されます）</span>}
          </Label>
        </div>
        {isAlert && (
          <div className="px-3 pb-3">
            <textarea
              value={alertReason}
              onChange={(e) => setAlertReason(e.target.value)}
              placeholder="要注意の理由を入力（例：無断キャンセル、支払いトラブルなど）"
              rows={3}
              className="w-full text-sm rounded-md border border-red-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-red-300 resize-none"
            />
          </div>
        )}
      </div>

      {/* キープボトル */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-gray-700">
            キープボトル
            {visibleBottles.length > 0 && (
              <span className="ml-2 text-xs text-gray-500">{visibleBottles.length}本</span>
            )}
          </Label>
          <button
            type="button"
            onClick={addBottle}
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 font-medium"
          >
            <Plus className="h-4 w-4" />
            追加
          </button>
        </div>

        {visibleBottles.length === 0 && (
          <p className="text-xs text-gray-400 py-1">ボトルを追加する場合は「追加」を押してください</p>
        )}

        <div className="space-y-3">
          {visibleBottles.map((bottle) => (
            <div key={bottle.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <GiBrandyBottle size={16} className="text-gray-500 shrink-0" />
                <Input
                  value={bottle.name}
                  onChange={(e) => updateBottleField(bottle.id, 'name', e.target.value)}
                  placeholder="ボトル名（例：山崎12年）"
                  className="flex-1 h-8 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeBottle(bottle.id)}
                  className="text-gray-400 hover:text-red-500 shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 残量スライダー */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">残量</span>
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
                    onChange={(e) => updateBottleField(bottle.id, 'remaining', Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-gray-800"
                    style={{
                      background: `linear-gradient(to right, #1f2937 0%, #1f2937 ${bottle.remaining}%, #e7e5e4 ${bottle.remaining}%, #e7e5e4 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400">0%</span>
                    <span className="text-[10px] text-gray-400">50%</span>
                    <span className="text-[10px] text-gray-400">100%</span>
                  </div>
                </div>
              </div>

              {/* 開封日 */}
              <div className="space-y-1">
                <span className="text-xs text-gray-500">開封日</span>
                <Input
                  type="date"
                  value={bottle.openedDate}
                  onChange={(e) => updateBottleField(bottle.id, 'openedDate', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 同伴者・グループ客 */}
      {otherCustomers.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-gray-700">
            同伴者・グループ客
            {linkedIds.length > 0 && (
              <span className="ml-2 text-xs text-gray-500">{linkedIds.length}名選択中</span>
            )}
          </Label>
          <div className="rounded-lg border border-stone-200 bg-stone-50 overflow-hidden">
            {linkedIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-stone-200">
                {linkedIds.map((id) => {
                  const c = otherCustomers.find((x) => x.id === id)
                  if (!c) return null
                  return (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-200 text-xs text-gray-800">
                      {c.name}
                      <button type="button" onClick={() => toggleLinked(id)} className="text-gray-500 hover:text-gray-900">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={linkedQuery}
                onChange={(e) => setLinkedQuery(e.target.value)}
                placeholder="名前・ふりがな・ニックネームで検索"
                className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-0 outline-none text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="max-h-40 overflow-y-auto border-t border-stone-200">
              {filteredCustomers.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">該当する顧客がいません</p>
              ) : (
                filteredCustomers.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
                      ${linkedIds.includes(c.id) ? 'bg-gray-100' : 'hover:bg-stone-100'}`}
                  >
                    <input
                      type="checkbox"
                      checked={linkedIds.includes(c.id)}
                      onChange={() => toggleLinked(c.id)}
                      className="accent-gray-800"
                    />
                    <span className="text-sm text-gray-800">{c.name}</span>
                    <span className="text-xs text-gray-400">({c.ruby})</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 hover:bg-gray-700 text-white font-bold h-11"
      >
        {loading ? '更新中...' : '更新する'}
      </Button>
    </form>
  )
}
