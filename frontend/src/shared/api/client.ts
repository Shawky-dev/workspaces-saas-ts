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

function resolveUrl(path: string) {
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

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(resolveUrl(path), {
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
