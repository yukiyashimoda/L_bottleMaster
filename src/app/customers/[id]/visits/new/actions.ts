'use server'

import { createVisitRecord, createBottle, updateBottle } from '@/lib/kv'

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

    return { success: true }
  } catch (e) {
    return { success: false, error: '記録に失敗しました' }
  }
}
