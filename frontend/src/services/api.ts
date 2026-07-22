const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

type ApiErrorPayload = {
  message?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message)
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('auth_token')
  const headers = new Headers(options.headers)

  headers.set('Accept', 'application/json')
  headers.set('Content-Type', 'application/json')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload
    throw new ApiError(
      payload.message ?? 'Não foi possível concluir a operação.',
      response.status,
      payload.errors,
    )
  }

  return response.json() as Promise<T>
}
