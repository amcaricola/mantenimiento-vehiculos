import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import { createTestApp, login, bearer, TEST_MASTER_KEY, type TestApp } from '../helpers'

const instances: TestApp[] = []

async function app() {
  const instance = await createTestApp()
  instances.push(instance)
  return instance.app
}

afterEach(async () => {
  for (const instance of instances) {
    await fs.rm(instance.tmpDir, { recursive: true, force: true })
  }
  instances.length = 0
})

describe('API de autenticación', () => {
  it('rechaza login con clave incorrecta', async () => {
    const a = await app()
    const res = await a.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ masterKey: 'clave-equivocada' }),
    })
    expect(res.status).toBe(401)
  })

  it('rechaza login sin clave', async () => {
    const a = await app()
    const res = await a.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('emite token 24h con clave correcta', async () => {
    const a = await app()
    const res = await a.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ masterKey: TEST_MASTER_KEY }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { token: string; expiresAt: string }
    expect(body.token).toBeTruthy()
    const exp = new Date(body.expiresAt).getTime()
    const now = Date.now()
    expect(exp - now).toBeGreaterThan(23 * 3600 * 1000)
    expect(exp - now).toBeLessThan(25 * 3600 * 1000)
  })

  it('verifica un token válido', async () => {
    const a = await app()
    const token = await login(a)
    const res = await a.request('/api/auth/verify', { headers: bearer(token) })
    expect(await res.json()).toEqual({ valid: true })
  })

  it('verifica que un token ausente es inválido', async () => {
    const a = await app()
    const res = await a.request('/api/auth/verify')
    expect(await res.json()).toEqual({ valid: false })
  })

  it('verifica que un token corrupto es inválido', async () => {
    const a = await app()
    const res = await a.request('/api/auth/verify', {
      headers: bearer('token.invalido.xxx'),
    })
    expect(await res.json()).toEqual({ valid: false })
  })

  it('rechaza crear vehículo sin token', async () => {
    const a = await app()
    const res = await a.request('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(401)
  })

  it('rechaza crear vehículo con token inválido', async () => {
    const a = await app()
    const res = await a.request('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...bearer('mal.token.aqui') },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(401)
  })
})