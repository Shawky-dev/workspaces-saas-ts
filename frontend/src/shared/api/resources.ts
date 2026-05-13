import { apiRequest } from './client'
import type {
  AuthResponse,
  CreateTenantPayload,
  CreateUserPayload,
  MeResponse,
  Tenant,
  UpdateTenantPayload,
  UpdateUserPayload,
  User,
} from '@/shared/types/api'

export function commonLogin(email: string, password: string) {
  return apiRequest<AuthResponse>('/auth/common/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function tenantLogin(tenantId: string, email: string, password: string) {
  return apiRequest<AuthResponse>(`/auth/${tenantId}/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function commonMe(token: string) {
  return apiRequest<MeResponse>('/auth/common/me', { token })
}

export function tenantMe(tenantId: string, token: string) {
  return apiRequest<MeResponse>(`/auth/${tenantId}/me`, { token })
}

export function listTenants(token?: string | null) {
  return apiRequest<Tenant[]>('/tenants', { token })
}

export function createTenant(payload: CreateTenantPayload, token?: string | null) {
  return apiRequest<Tenant>('/tenants', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export function updateTenant(slug: string, payload: UpdateTenantPayload, token?: string | null) {
  return apiRequest<Tenant>(`/tenants/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}

export function deleteTenant(slug: string, token?: string | null) {
  return apiRequest<Tenant>(`/tenants/${slug}`, {
    method: 'DELETE',
    token,
  })
}

export function listCommonUsers(token?: string | null) {
  return apiRequest<User[]>('/common/users', { token })
}

export function createCommonUser(payload: CreateUserPayload, token?: string | null) {
  return apiRequest<User>('/common/users', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export function updateCommonUser(id: string, payload: UpdateUserPayload, token?: string | null) {
  return apiRequest<User>(`/common/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}

export function deleteCommonUser(id: string, token?: string | null) {
  return apiRequest<User>(`/common/users/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function listTenantUsers(tenantId: string, token?: string | null) {
  return apiRequest<User[]>(`/${tenantId}/users`, { token })
}

export function createTenantUser(tenantId: string, payload: CreateUserPayload, token?: string | null) {
  return apiRequest<User>(`/${tenantId}/users`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export function updateTenantUser(
  tenantId: string,
  id: string,
  payload: UpdateUserPayload,
  token?: string | null,
) {
  return apiRequest<User>(`/${tenantId}/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}

export function deleteTenantUser(tenantId: string, id: string, token?: string | null) {
  return apiRequest<User>(`/${tenantId}/users/${id}`, {
    method: 'DELETE',
    token,
  })
}
