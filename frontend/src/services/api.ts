import type { AuthResponse } from '../types/api'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = await response.json() as { message?: string; details?: string[] }
    if (payload.message) {
      return payload.message
    }
    if (payload.details?.length) {
      return payload.details.join(', ')
    }
  } catch {
    // ignore json parsing errors
  }
  return `Request failed (${response.status})`
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response))
  }
  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
}

export async function register(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName })
  })
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export async function fetchMe(token: string): Promise<AuthResponse['user']> {
  return apiRequest<AuthResponse['user']>('/api/auth/me', { method: 'GET' }, token)
}

export interface SettingsPayload {
  currency: string
  pushEnabled: boolean
}

export async function getSettings(token: string): Promise<SettingsPayload> {
  return apiRequest<SettingsPayload>('/api/settings', { method: 'GET' }, token)
}

export async function updateSettings(token: string, payload: SettingsPayload): Promise<SettingsPayload> {
  return apiRequest<SettingsPayload>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }, token)
}

export async function subscribePush(
  token: string,
  endpoint: string,
  p256dh: string,
  auth: string
): Promise<{ status: string }> {
  return apiRequest('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({ endpoint, p256dh, auth })
  }, token)
}

export async function unsubscribePush(token: string, endpoint?: string | null): Promise<{ status: string }> {
  const payload = endpoint ? { endpoint } : {}
  return apiRequest('/api/push/unsubscribe', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, token)
}

export async function sendTestPush(token: string): Promise<{ status: string }> {
  console.log("Sending test push request with token: ", token)
  return apiRequest('/api/push/test', {
    method: 'POST',
    body: JSON.stringify({})
  }, token)
}

export function getApiBaseUrl(): string {
  return API_BASE
}
