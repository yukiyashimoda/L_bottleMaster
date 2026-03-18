import type { Customer, Bottle, Cast, VisitRecord } from '@/types'
import {
  mockCustomers,
  mockBottles,
  mockCasts,
  mockVisitRecords,
} from './mock-data'

// In-memory store for development
const store = {
  customers: new Map<string, Customer>(mockCustomers.map((c) => [c.id, c])),
  bottles: new Map<string, Bottle>(mockBottles.map((b) => [b.id, b])),
  casts: new Map<string, Cast>(mockCasts.map((c) => [c.id, c])),
  visitRecords: new Map<string, VisitRecord>(
    mockVisitRecords.map((v) => [v.id, v])
  ),
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Customer CRUD
export async function getCustomers(): Promise<Customer[]> {
  return Array.from(store.customers.values()).sort((a, b) =>
    a.ruby.localeCompare(b.ruby, 'ja')
  )
}

export async function getCustomer(id: string): Promise<Customer | null> {
  return store.customers.get(id) ?? null
}

export async function createCustomer(
  data: Omit<Customer, 'id' | 'updatedAt'>
): Promise<Customer> {
  const customer: Customer = {
    ...data,
    id: generateId(),
    updatedAt: new Date().toISOString(),
  }
  store.customers.set(customer.id, customer)
  return customer
}

export async function updateCustomer(
  id: string,
  data: Partial<Omit<Customer, 'id'>>
): Promise<Customer | null> {
  const existing = store.customers.get(id)
  if (!existing) return null
  const updated: Customer = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  }
  store.customers.set(id, updated)
  return updated
}

export async function deleteCustomer(id: string): Promise<boolean> {
  return store.customers.delete(id)
}

// Bottle CRUD
export async function getBottles(): Promise<Bottle[]> {
  return Array.from(store.bottles.values())
}

export async function getBottlesByCustomer(customerId: string): Promise<Bottle[]> {
  return Array.from(store.bottles.values()).filter(
    (b) => b.customerId === customerId
  )
}

export async function getBottle(id: string): Promise<Bottle | null> {
  return store.bottles.get(id) ?? null
}

export async function createBottle(
  data: Omit<Bottle, 'id'>
): Promise<Bottle> {
  const bottle: Bottle = { ...data, id: generateId() }
  store.bottles.set(bottle.id, bottle)
  return bottle
}

export async function updateBottle(
  id: string,
  data: Partial<Omit<Bottle, 'id'>>
): Promise<Bottle | null> {
  const existing = store.bottles.get(id)
  if (!existing) return null
  const updated: Bottle = { ...existing, ...data, id }
  store.bottles.set(id, updated)
  return updated
}

export async function deleteBottle(id: string): Promise<boolean> {
  return store.bottles.delete(id)
}

// Cast CRUD
export async function getCasts(): Promise<Cast[]> {
  return Array.from(store.casts.values()).sort((a, b) =>
    a.ruby.localeCompare(b.ruby, 'ja')
  )
}

export async function getCast(id: string): Promise<Cast | null> {
  return store.casts.get(id) ?? null
}

export async function createCast(data: Omit<Cast, 'id' | 'updatedAt'>): Promise<Cast> {
  const cast: Cast = { ...data, id: generateId(), updatedAt: new Date().toISOString() }
  store.casts.set(cast.id, cast)
  return cast
}

export async function updateCast(
  id: string,
  data: Partial<Omit<Cast, 'id' | 'updatedAt'>>
): Promise<Cast | null> {
  const existing = store.casts.get(id)
  if (!existing) return null
  const updated: Cast = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
  store.casts.set(id, updated)
  return updated
}

// VisitRecord CRUD
export async function getVisitRecords(): Promise<VisitRecord[]> {
  return Array.from(store.visitRecords.values()).sort(
    (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
  )
}

export async function getVisitRecordsByCustomer(
  customerId: string
): Promise<VisitRecord[]> {
  return Array.from(store.visitRecords.values())
    .filter((v) => v.customerId === customerId)
    .sort(
      (a, b) =>
        new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    )
}

export async function getVisitRecordsByCast(
  castId: string
): Promise<VisitRecord[]> {
  return Array.from(store.visitRecords.values())
    .filter((v) => v.designatedCastIds.includes(castId))
    .sort(
      (a, b) =>
        new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    )
}

export async function createVisitRecord(
  data: Omit<VisitRecord, 'id'>
): Promise<VisitRecord> {
  const record: VisitRecord = { ...data, id: generateId() }
  store.visitRecords.set(record.id, record)

  // Update customer lastVisitDate
  const customer = store.customers.get(data.customerId)
  if (customer) {
    store.customers.set(data.customerId, {
      ...customer,
      lastVisitDate: data.visitDate,
      updatedAt: new Date().toISOString(),
    })
  }

  return record
}
