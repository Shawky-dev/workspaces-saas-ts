import { apiBlobRequest, apiRequest, resolveApiUrl } from './client'
import type {
  AuthResponse,
  BulkUpdateCatalogQuantityItem,
  CatalogItem,
  CreateCatalogItemPayload,
  CreateTenantPayload,
  CreateUserPayload,
  MeResponse,
  Tenant,
  UpdateCatalogItemPayload,
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

function catalogItemFormData(payload: CreateCatalogItemPayload | UpdateCatalogItemPayload) {
  const formData = new FormData()

  if (payload.name !== undefined) {
    formData.append('name', payload.name)
  }

  if (payload.purchasePrice !== undefined) {
    formData.append('purchasePrice', String(payload.purchasePrice))
  }

  if (payload.soldPrice !== undefined) {
    formData.append('soldPrice', String(payload.soldPrice))
  }

  if (payload.description !== undefined) {
    formData.append('description', payload.description)
  }

  if (payload.quantityOnHand !== undefined) {
    formData.append('quantityOnHand', String(payload.quantityOnHand))
  }

  if (payload.image) {
    formData.append('image', payload.image)
  }

  return formData
}

export function listCatalogItems(tenantId: string, token?: string | null) {
  return apiRequest<CatalogItem[]>(`/${tenantId}/catalog/items`, { token })
}

export function createCatalogItem(
  tenantId: string,
  payload: CreateCatalogItemPayload,
  token?: string | null,
) {
  return apiRequest<CatalogItem>(`/${tenantId}/catalog/items`, {
    method: 'POST',
    body: catalogItemFormData(payload),
    token,
  })
}

export function updateCatalogItem(
  tenantId: string,
  id: string,
  payload: UpdateCatalogItemPayload,
  token?: string | null,
) {
  return apiRequest<CatalogItem>(`/${tenantId}/catalog/items/${id}`, {
    method: 'PATCH',
    body: catalogItemFormData(payload),
    token,
  })
}

export function deleteCatalogItem(tenantId: string, id: string, token?: string | null) {
  return apiRequest<CatalogItem>(`/${tenantId}/catalog/items/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function getCatalogItemImageUrl(tenantId: string, id: string) {
  return resolveApiUrl(`/${tenantId}/catalog/items/${id}/image`)
}

export function getCatalogItemImageBlob(tenantId: string, id: string, token?: string | null) {
  return apiBlobRequest(`/${tenantId}/catalog/items/${id}/image`, { token })
}

export function bulkUpdateCatalogQuantities(
  tenantId: string,
  items: BulkUpdateCatalogQuantityItem[],
  token?: string | null,
) {
  return apiRequest<CatalogItem[]>(`/${tenantId}/catalog/items/quantities`, {
    method: 'PATCH',
    body: JSON.stringify({ items }),
    token,
  })
}

export function adjustCatalogQuantity(
  tenantId: string,
  id: string,
  delta: number,
  token?: string | null,
) {
  return apiRequest<CatalogItem>(`/${tenantId}/catalog/items/${id}/adjust-quantity`, {
    method: 'POST',
    body: JSON.stringify({ delta }),
    token,
  })
}

export function listRooms(
  tenantId: string,
  token?: string | null,
) {
  return apiRequest(`/${tenantId}/rooms`, {
    token,
  })
}

export function createRoom(
  tenantId: string,
  payload: any,
  token?: string | null,
) {
  return apiRequest(`/${tenantId}/rooms`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export function updateRoom(
  tenantId: string,
  id: string,
  payload: any,
  token?: string | null,
) {
  return apiRequest(`/${tenantId}/rooms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}

export function deleteRoom(
  tenantId: string,
  id: string,
  token?: string | null,
) {
  return apiRequest(`/${tenantId}/rooms/${id}`, {
    method: 'DELETE',
    token,
  })
}
export function listCustomers(
  tenantId: string,
  token?: string | null,
) {
  return apiRequest(`/${tenantId}/customers`, {
    token,
  })
}

export function createCustomer(
  tenantId: string,
  payload: any,
  token?: string | null,
) {
  return apiRequest(`/${tenantId}/customers`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export function updateCustomer(
  tenantId: string,
  id: string,
  payload: any,
  token?: string | null,
) {
  return apiRequest(`/${tenantId}/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}

export function deleteCustomer(
  tenantId: string,
  id: string,
  token?: string | null,
) {
  return apiRequest(`/${tenantId}/customers/${id}`, {
    method: 'DELETE',
    token,
  })
}