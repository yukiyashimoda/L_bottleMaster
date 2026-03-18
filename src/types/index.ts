export interface Customer {
  id: string
  name: string
  ruby: string
  nickname: string
  designatedCastIds: string[]
  isAlert: boolean
  alertReason: string
  memo: string
  linkedCustomerIds: string[]
  isFavorite: boolean
  hasGlass: boolean
  glassMemo: string
  receiptNames: string[]
  lastVisitDate: string | null
  updatedAt: string
  updatedBy: string
}

export interface Bottle {
  id: string
  customerId: string
  name: string
  remaining: string
  openedDate: string
}

export interface Cast {
  id: string
  name: string
  ruby: string
  memo: string
  updatedAt: string
  updatedBy: string
}

export interface VisitRecord {
  id: string
  customerId: string
  visitDate: string
  designatedCastIds: string[]
  inStoreCastIds: string[]
  bottlesOpened: string[]
  bottlesUsed: string[]
  memo: string
  isAlert?: boolean
  alertReason?: string
}
