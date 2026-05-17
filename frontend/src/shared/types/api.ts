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
