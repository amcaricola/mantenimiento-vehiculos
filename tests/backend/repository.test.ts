import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { JsonDbRepository } from '../../src/backend/storage/json-db.repository'
import type { Vehiculo } from '../../src/shared/types'

let tmpDir: string
let repo: JsonDbRepository

function makeVehiculo(patente: string): Vehiculo {
  return {
    id: `id-${patente}`,
    patente,
    marca: 'Marca',
    modelo: 'Modelo',
    tipo: 'Automóvil',
    fechaUltimaRevision: '2025-01-01',
    revisiones: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mveh-repo-'))
  repo = new JsonDbRepository(path.join(tmpDir, 'data', 'db.json'))
  await repo.init()
})

describe('JsonDbRepository', () => {
  it('crea el archivo con una base limpia si no existe', async () => {
    const content = await fs.readFile(path.join(tmpDir, 'data', 'db.json'), 'utf-8')
    const db = JSON.parse(content) as { version: number; vehiculos: Vehiculo[] }
    expect(db.version).toBe(1)
    expect(db.vehiculos.length).toBe(0)
  })

  it('crea y recupera un vehículo', async () => {
    const vehiculo = makeVehiculo('AAAA-11')
    await repo.create(vehiculo)
    const found = await repo.findById(vehiculo.id)
    expect(found).toEqual(vehiculo)
    expect((await repo.findAll()).length).toBe(1)
  })

  it('actualiza un vehículo existente', async () => {
    const vehiculo = makeVehiculo('BBBB-22')
    await repo.create(vehiculo)
    const updated = { ...vehiculo, modelo: 'Corolla' }
    await repo.update(vehiculo.id, updated)
    const found = await repo.findById(vehiculo.id)
    expect(found?.modelo).toBe('Corolla')
  })

  it('lanza error al actualizar un id inexistente', async () => {
    await expect(repo.update('no-existe', makeVehiculo('CCCC-33'))).rejects.toThrow()
  })

  it('elimina un vehículo y retorna false si no existe', async () => {
    const vehiculo = makeVehiculo('DDDD-44')
    await repo.create(vehiculo)
    expect(await repo.remove(vehiculo.id)).toBe(true)
    expect(await repo.findById(vehiculo.id)).toBeNull()
    expect(await repo.remove(vehiculo.id)).toBe(false)
  })

  it('persiste los cambios entre instancias (reinicio)', async () => {
    const vehiculo = makeVehiculo('EEEE-55')
    await repo.create(vehiculo)

    const repo2 = new JsonDbRepository(path.join(tmpDir, 'data', 'db.json'))
    const found = await repo2.findById(vehiculo.id)
    expect(found?.patente).toBe('EEEE-55')
  })
})