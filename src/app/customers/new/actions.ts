'use server'

import { createCustomer, createBottle } from '@/lib/kv'
import { getSessionUser } from '@/lib/auth'
import type { Customer } from '@/types'

interface NewBottleInput {
  name: string
  remaining: string
  openedDate: string
}

export async function createCustomerAction(
  data: Omit<Customer, 'id' | 'updatedAt' | 'updatedBy'>,
  bottles: NewBottleInput[] = []
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const updatedBy = (await getSessionUser()) ?? ''
    const customer = await createCustomer({ ...data, updatedBy })
    await Promise.all(
      bottles.map((b) =>
        createBottle({
          customerId: customer.id,
          name: b.name,
          remaining: b.remaining,
          openedDate: b.openedDate,
        })
      )
    )
    return { success: true, id: customer.id }
  } catch (e) {
    return { success: false, error: '登録に失敗しました' }
  }
}
