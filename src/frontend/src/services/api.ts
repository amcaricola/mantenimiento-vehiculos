import type { Vehiculo, VehiculoConEstado } from '../../../shared/types.js'

export class UnauthorizedError extends Error {
  constructor(message = 'Sesión expirada') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  timeoutMs = 60000,
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const headers = new Headers(options.headers)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    const res = await fetch(path, { ...options, headers, signal: controller.signal })

    if (!res.ok) {
      let message = `Error ${res.status}`
      try {
        const data = await res.json()
        if (data?.error) message = data.error
      } catch {
        // sin cuerpo JSON
      }
      if (res.status === 401) {
        throw new UnauthorizedError(message)
      }
      throw new ApiError(message, res.status)
    }

    if (res.status === 204) {
      return undefined as T
    }
    return (await res.json()) as T
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw new ApiError('La solicitud tardó demasiado. Reintenta.', 0)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export interface LoginResult {
  token: string
  expiresAt: string
}

export const api = {
  getVehicles: (token?: string | null) =>
    request<VehiculoConEstado[]>('/api/vehicles', {}, token),

  getVehicle: (id: string, token?: string | null) =>
    request<VehiculoConEstado>(`/api/vehicles/${id}`, {}, token),

  createVehicle: (data: Record<string, unknown>, token: string) =>
    request<Vehiculo>('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, token),

  updateVehicle: (
    id: string,
    data: Record<string, unknown>,
    token: string,
  ) =>
    request<Vehiculo>(`/api/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, token),

  deleteVehicle: (id: string, token: string) =>
    request<void>(`/api/vehicles/${id}`, { method: 'DELETE' }, token),

  exportVehicles: (token: string) =>
    request<{ version: number; exportedAt: string; vehiculos: Vehiculo[] }>(
      '/api/vehicles/export',
      {},
      token,
    ),

  importVehicles: (payload: unknown, token: string) =>
    request<{ imported: number }>('/api/vehicles/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, token),

  login: (masterKey: string) =>
    request<LoginResult>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ masterKey }),
    }),

  verify: (token: string) =>
    request<{ valid: boolean }>('/api/auth/verify', {}, token),

  uploadImage: (
    vehicleId: string,
    revisionId: string,
    file: File,
    token: string,
  ) => {
    const form = new FormData()
    form.append('image', file)
    return request<{ vehiculo: Vehiculo; url: string }>(
      `/api/vehicles/${vehicleId}/revision/${revisionId}/image`,
      { method: 'POST', body: form },
      token,
      120000,
    )
  },

  deleteImage: (vehicleId: string, revisionId: string, token: string) =>
    request<{ vehiculo: Vehiculo }>(
      `/api/vehicles/${vehicleId}/revision/${revisionId}/image`,
      { method: 'DELETE' },
      token,
    ),
}