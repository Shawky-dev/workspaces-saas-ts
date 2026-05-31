export interface User {
  id: string
  email: string
  name: string
  createdAt?: string
  updatedAt?: string
}

export interface Tenant {
  _id?: string
  slug: string
  name: string
  mongoUri?: string
  enabled: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

export interface MeResponse {
  user: User & { tenantId?: string }
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  password?: string
}

export interface CreateTenantPayload {
  slug: string
  name: string
  enabled?: boolean
  adminName: string
  adminEmail: string
  adminPassword: string
}

export interface UpdateTenantPayload {
  name?: string
  enabled?: boolean
}

export interface CatalogItemImage {
  contentType: string
  originalName?: string
  size?: number
}

export interface CatalogItem {
  id: string
  name: string
  purchasePrice: number
  soldPrice: number
  description: string
  quantityOnHand: number
  image: CatalogItemImage | null
  hasImage: boolean
  imageUrl: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateCatalogItemPayload {
  name: string
  purchasePrice: number
  soldPrice: number
  description?: string
  quantityOnHand?: number
  image?: File | null
}

export interface UpdateCatalogItemPayload {
  name?: string
  purchasePrice?: number
  soldPrice?: number
  description?: string
  quantityOnHand?: number
  image?: File | null
}

export interface BulkUpdateCatalogQuantityItem {
  id: string
  quantityOnHand: number
}

export type RoomType = 'private' | 'public'
export type SessionStatus = 'active' | 'closed'
export type PaymentStatus = 'paid' | 'unpaid' | 'partial'
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'bank_transfer' | 'mixed' | 'other'

export interface Customer {
  _id: string
  firstName: string
  lastName: string
  phoneNumber: string
  email?: string
  notes?: string
  isBlocked?: boolean
}

export interface RoomAvailability {
  id: string
  name: string
  type: RoomType
  ratePerHour: number
  totalSeats: number
  occupiedSeats: number
  availableSeats: number
  isAvailable: boolean
}

export interface SessionCustomerSnapshot {
  customerId: string
  firstName: string
  lastName: string
  phoneNumber: string
  email?: string
}

export interface SessionRoomBooking {
  roomId: string
  roomName: string
  type: RoomType
  ratePerHour: number
  seatCount: number
}

export interface SessionProductLine {
  catalogItemId: string
  name: string
  unitPrice: number
  quantity: number
}

export interface SessionReceiptTotals {
  billableMinutes: number
  roomSubtotal: number
  productsSubtotal: number
  discount: number
  total: number
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  roomBookings: SessionRoomBooking[]
  productLines: SessionProductLine[]
}

export interface Session {
  id: string
  status: SessionStatus
  customer: SessionCustomerSnapshot
  roomBookings: SessionRoomBooking[]
  productLines: SessionProductLine[]
  startedAt: string
  closedAt?: string
  receipt?: SessionReceiptTotals
  createdAt?: string
  updatedAt?: string
}

export interface Receipt {
  id: string
  sessionId: string
  customer: SessionCustomerSnapshot
  startedAt: string
  closedAt?: string
  receipt: SessionReceiptTotals
  createdAt?: string
  updatedAt?: string
}

export interface StartSessionPayload {
  customerId?: string
  customer?: {
    firstName: string
    lastName: string
    phoneNumber: string
    email?: string
  }
  roomBookings: Array<{
    roomId: string
    seatCount?: number
  }>
}

export interface UpdateSessionProductsPayload {
  products: Array<{
    catalogItemId: string
    quantity: number
  }>
}

export interface CloseSessionPayload {
  discount?: number
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
}
