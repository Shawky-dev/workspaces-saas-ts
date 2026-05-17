const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null
}

export function resolveApiUrl(path: string) {
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

async function parseResponse(response: Response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  return JSON.parse(text)
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  if (!headers.has('Content-Type') && options.body && !isFormData) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(resolveApiUrl(path), {
    ...options,
    headers,
  })
  const payload = await parseResponse(response)

  if (!response.ok) {
    const message = payload?.message
    throw new ApiError(
      Array.isArray(message) ? message.join(', ') : message || 'Request failed',
      response.status,
    )
  }

  return payload as T
}

export async function apiBlobRequest(
  path: string,
  options: RequestOptions = {},
): Promise<Blob> {
  const headers = new Headers(options.headers)

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(resolveApiUrl(path), {
    ...options,
    headers,
  })

  if (!response.ok) {
    const payload = await parseResponse(response)
    const message = payload?.message
    throw new ApiError(
      Array.isArray(message) ? message.join(', ') : message || 'Request failed',
      response.status,
    )
  }

  return response.blob()
}
