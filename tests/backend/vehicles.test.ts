import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createTestApp, login, bearer, type TestApp } from '../helpers'
import type { Vehiculo } from '../../src/shared/types'

const instances: TestApp[] = []

async function setup() {
  const instance = await createTestApp()
  instances.push(instance)
  return instance
}

afterEach(async () => {
  for (const instance of instances) {
    await fs.rm(instance.tmpDir, { recursive: true, force: true })
  }
  instances.length = 0
})

const validPayload = {
  patente: 'HHJJ-12',
  marca: 'Mazda',
  modelo: 'CX-5',
  tipo: 'Automóvil',
  fechaUltimaRevision: '2025-01-10',
  revisiones: [
    {
      tipo: 'revision_tecnica',
      nombre: 'Revisión Técnica',
      fechaProximaRevision: '2026-01-10',
    },
    {
      tipo: 'seguro',
      nombre: 'Seguro Obligatorio (SOAP)',
      fechaProximaRevision: '2026-03-01',
    },
  ],
}

describe('API de vehículos', () => {
  it('expone el listado públicamente con estados calculados', async () => {
    const { app } = await setup()
    const res = await app.request('/api/vehicles')
    expect(res.status).toBe(200)
    const body = (await res.json()) as Vehiculo[]
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThanOrEqual(2)
    const first = body[0] as Vehiculo & {
      revisiones: Array<{ estado: string; diasRestantes: number | null }>
    }
    expect(first.patente).toBeTruthy()
    for (const rev of first.revisiones) {
      expect(['vencido', 'proximo', 'al_dia', 'sin_fecha']).toContain(rev.estado)
    }
  })

  it('obtiene detalle por id (público)', async () => {
    const { app } = await setup()
    const listRes = await app.request('/api/vehicles')
    const list = (await listRes.json()) as Vehiculo[]
    const res = await app.request(`/api/vehicles/${list[0].id}`)
    expect(res.status).toBe(200)
    const body = (await res.json()) as Vehiculo
    expect(body.id).toBe(list[0].id)
  })

  it('devuelve 404 para un id inexistente', async () => {
    const { app } = await setup()
    const res = await app.request('/api/vehicles/id-inventado')
    expect(res.status).toBe(404)
  })

  it('crea un vehículo con token', async () => {
    const { app } = await setup()
    const token = await login(app)
    const res = await app.request('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...bearer(token) },
      body: JSON.stringify(validPayload),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as Vehiculo
    expect(body.patente).toBe('HHJJ-12')
    expect(body.revisiones).toHaveLength(2)
    expect(body.revisiones[0].id).toBeTruthy()
  })

  it('valida datos inválidos al crear', async () => {
    const { app } = await setup()
    const token = await login(app)
    const res = await app.request('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...bearer(token) },
      body: JSON.stringify({ patente: '', marca: '', modelo: '', tipo: '' }),
    })
    expect(res.status).toBe(400)
  })

  it('actualiza un vehículo con token', async () => {
    const { app } = await setup()
    const token = await login(app)
    const createdRes = await app.request('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...bearer(token) },
      body: JSON.stringify(validPayload),
    })
    const created = (await createdRes.json()) as Vehiculo

    const updRes = await app.request(`/api/vehicles/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...bearer(token) },
      body: JSON.stringify({
        modelo: 'CX-30',
        fechaUltimaRevision: '2025-05-01',
        revisiones: created.revisiones,
      }),
    })
    expect(updRes.status).toBe(200)
    const updated = (await updRes.json()) as Vehiculo
    expect(updated.modelo).toBe('CX-30')
    expect(updated.fechaUltimaRevision).toBe('2025-05-01')
    expect(updated.revisiones).toHaveLength(2)
  })

  it('no permite actualizar sin token', async () => {
    const { app } = await setup()
    const res = await app.request('/api/vehicles/cualquiera', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(401)
  })

  it('elimina un vehículo con token y devuelve 204', async () => {
    const { app } = await setup()
    const token = await login(app)
    const createdRes = await app.request('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...bearer(token) },
      body: JSON.stringify(validPayload),
    })
    const created = (await createdRes.json()) as Vehiculo

    const delRes = await app.request(`/api/vehicles/${created.id}`, {
      method: 'DELETE',
      headers: bearer(token),
    })
    expect(delRes.status).toBe(204)

    const getRes = await app.request(`/api/vehicles/${created.id}`)
    expect(getRes.status).toBe(404)
  })

  it('sube y elimina una imagen de respaldo por revisión', async () => {
    const { app, env } = await setup()
    const token = await login(app)
    const createdRes = await app.request('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...bearer(token) },
      body: JSON.stringify(validPayload),
    })
    const created = (await createdRes.json()) as Vehiculo
    const revisionId = created.revisiones[0].id

    const form = new FormData()
    const fakeBytes = new TextEncoder().encode('fake-jpeg-content')
    form.append('image', new File([fakeBytes], 'respaldo.jpg', { type: 'image/jpeg' }))

    const upRes = await app.request(
      `/api/vehicles/${created.id}/revision/${revisionId}/image`,
      { method: 'POST', headers: bearer(token), body: form },
    )
    expect(upRes.status).toBe(201)
    const upBody = (await upRes.json()) as { url: string }
    expect(upBody.url).toMatch(/^\/uploads\//)

    const filePath = path.join(env.UPLOADS_DIR, upBody.url.replace('/uploads/', ''))
    const fileContent = await fs.readFile(filePath)
    expect(fileContent.toString()).toBe('fake-jpeg-content')

    const delRes = await app.request(
      `/api/vehicles/${created.id}/revision/${revisionId}/image`,
      { method: 'DELETE', headers: bearer(token) },
    )
    expect(delRes.status).toBe(200)
    await expect(fs.access(filePath)).rejects.toThrow()
  })

  it('rechaza subir una imagen sin token', async () => {
    const { app } = await setup()
    const listRes = await app.request('/api/vehicles')
    const list = (await listRes.json()) as Vehiculo[]
    const form = new FormData()
    form.append('image', new File([new Uint8Array([1])], 'x.jpg', { type: 'image/jpeg' }))
    const res = await app.request(
      `/api/vehicles/${list[0].id}/revision/${list[0].revisiones[0].id}/image`,
      { method: 'POST', body: form },
    )
    expect(res.status).toBe(401)
  })

  it('rechaza subir un archivo que no es imagen', async () => {
    const { app } = await setup()
    const token = await login(app)
    const listRes = await app.request('/api/vehicles')
    const list = (await listRes.json()) as Vehiculo[]
    const form = new FormData()
    form.append('image', new File([new TextEncoder().encode('texto')], 'doc.txt', { type: 'text/plain' }))
    const res = await app.request(
      `/api/vehicles/${list[0].id}/revision/${list[0].revisiones[0].id}/image`,
      { method: 'POST', headers: bearer(token), body: form },
    )
    expect(res.status).toBe(400)
  })

  describe('export / import', () => {
    it('requiere token para exportar', async () => {
      const { app } = await setup()
      const res = await app.request('/api/vehicles/export')
      expect(res.status).toBe(401)
    })

    it('exporta los vehículos con token', async () => {
      const { app } = await setup()
      const token = await login(app)
      const res = await app.request('/api/vehicles/export', { headers: bearer(token) })
      expect(res.status).toBe(200)
      const body = (await res.json()) as {
        version: number
        exportedAt: string
        vehiculos: Vehiculo[]
      }
      expect(body.vehiculos.length).toBeGreaterThanOrEqual(2)
      expect(body.vehiculos[0].id).toBeTruthy()
    })

    it('importa datos y reemplaza la lista', async () => {
      const { app } = await setup()
      const token = await login(app)

      const exportRes = await app.request('/api/vehicles/export', {
        headers: bearer(token),
      })
      const exported = (await exportRes.json()) as {
        vehiculos: Vehiculo[]
      }
      const backup = exported.vehiculos[0]

      const importRes = await app.request('/api/vehicles/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...bearer(token) },
        body: JSON.stringify({
          version: 1,
          exportedAt: new Date().toISOString(),
          vehiculos: [backup],
        }),
      })
      expect(importRes.status).toBe(200)
      const result = (await importRes.json()) as { imported: number }
      expect(result.imported).toBe(1)

      const listRes = await app.request('/api/vehicles')
      const list = (await listRes.json()) as Vehiculo[]
      expect(list).toHaveLength(1)
    })

    it('rechaza importar un payload inválido', async () => {
      const { app } = await setup()
      const token = await login(app)
      const res = await app.request('/api/vehicles/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...bearer(token) },
        body: JSON.stringify({ vehiculos: [{ patente: 'X' }] }),
      })
      expect(res.status).toBe(400)
    })

    it('requiere token para importar', async () => {
      const { app } = await setup()
      const res = await app.request('/api/vehicles/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehiculos: [] }),
      })
      expect(res.status).toBe(401)
    })
  })
})