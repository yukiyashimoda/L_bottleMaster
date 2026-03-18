'use server'

import { createVisitRecord, createBottle, updateBottle, getCustomer, updateCustomer } from '@/lib/kv'

interface BottleUpdate {
  id: string
  remaining: string
}

interface NewBottleInput {
  name: string
  remaining: string
  openedDate: string
}

interface CreateVisitInput {
  customerId: string
  visitDate: string
  designatedCastIds: string[]
  inStoreCastIds: string[]
  bottleUpdates: BottleUpdate[]
  newBottles: NewBottleInput[]
  memo: string
  linkedCustomerIds: string[]
}

export async function createVisitAction(
  data: CreateVisitInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update existing bottles' remaining
    await Promise.all(
      data.bottleUpdates.map((b) => updateBottle(b.id, { remaining: b.remaining }))
    )

    // Create new bottles
    const openedBottleIds: string[] = []
    for (const nb of data.newBottles) {
      if (nb.name.trim()) {
        const bottle = await createBottle({
          customerId: data.customerId,
          name: nb.name.trim(),
          remaining: nb.remaining,
          openedDate: nb.openedDate,
        })
        openedBottleIds.push(bottle.id)
      }
    }

    await createVisitRecord({
      customerId: data.customerId,
      visitDate: data.visitDate,
      designatedCastIds: data.designatedCastIds,
      inStoreCastIds: data.inStoreCastIds,
      bottlesOpened: openedBottleIds,
      bottlesUsed: data.bottleUpdates.map((b) => b.id),
      memo: data.memo,
    })

    // 本指名キャストを顧客のdesignatedCastIdsにマージ
    if (data.designatedCastIds.length > 0) {
      const c = await getCustomer(data.customerId)
      if (c) {
        const merged = Array.from(new Set([...c.designatedCastIds, ...data.designatedCastIds]))
        await updateCustomer(data.customerId, { designatedCastIds: merged })
      }
    }

    // 同伴者のlinkedCustomerIdsを双方向に更新
    if (data.linkedCustomerIds.length > 0) {
      const mainCustomer = await getCustomer(data.customerId)
      if (mainCustomer) {
        const merged = Array.from(new Set([...mainCustomer.linkedCustomerIds, ...data.linkedCustomerIds]))
        await updateCustomer(data.customerId, { linkedCustomerIds: merged })
      }
      for (const linkedId of data.linkedCustomerIds) {
        const linked = await getCustomer(linkedId)
        if (linked) {
          const merged = Array.from(new Set([...linked.linkedCustomerIds, data.customerId]))
          await updateCustomer(linkedId, { linkedCustomerIds: merged })
        }
      }
    }

    return { success: true }
  } catch (e) {
    return { success: false, error: '記録に失敗しました' }
  }
}
