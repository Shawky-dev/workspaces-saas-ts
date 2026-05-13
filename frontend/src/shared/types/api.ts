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
