import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Vehiculo } from '../../src/shared/types'

vi.mock('@vercel/blob', () => ({
  list: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}))

import { list, put, del } from '@vercel/blob'
import { VercelBlobRepository } from '../../src/backend/storage/vercel-blob.repository'

const mockedList = vi.mocked(list)
const mockedPut = vi.mocked(put)
const mockedDel = vi.mocked(del)

function makeData(): { version: number; vehiculos: Vehiculo[] } {
  return {
    version: 1,
    vehiculos: [
      {
        id: 'v1',
        patente: 'AAAA-11',
        marca: 'Toyota',
        modelo: 'Hilux',
        tipo: 'Camioneta',
        revisiones: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  }
}

function mockBlobList(url: string): unknown {
  return {
    blobs: [
      {
        url,
        // addRandomSuffix genera "db-<aleatorio>.json" (sufijo antes de la extensión)
        pathname: 'db-abc.json',
        uploadedAt: new Date().toISOString(),
        size: 100,
        contentType: 'application/json',
      },
    ],
    hasMore: false,
    cursor: undefined,
  }
}

describe('VercelBlobRepository', () => {
  beforeEach(() => {
    mockedList.mockReset()
    mockedPut.mockReset()
    mockedDel.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('usa el prefijo "db" y encuentra blobs con sufijo aleatorio (db-xxx.json)', async () => {
    const data = makeData()
    mockedList.mockResolvedValue(
      mockBlobList('https://blob.example.com/db-abc.json') as never,
    )
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => data,
    } as never)
    vi.stubGlobal('fetch', fetchMock)

    const repo = new VercelBlobRepository()
    expect(await repo.findAll()).toHaveLength(1)
    expect(await repo.findAll()).toHaveLength(1)
    // El prefijo de listado debe ser "db" para detectar "db-<aleatorio>.json".
    // Si se usara "db.json" este test fallaría (regresión del bug de datos vacíos).
    expect(mockedList).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'db' }),
    )
  })

  it('redescubre datos creados por otra instancia tras estar vacío', async () => {
    // 1) El blob no tiene datos todavía
    mockedList.mockResolvedValue({ blobs: [], hasMore: false, cursor: undefined } as never)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const repo = new VercelBlobRepository()
    expect(await repo.findAll()).toHaveLength(0)

    // 2) Otra instancia escribe: ahora existe un blob con datos
    const data = makeData()
    mockedList.mockResolvedValue(mockBlobList('https://blob.example.com/db-abc.json') as never)
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => data,
    } as never)

    // 3) Esperar a que expire la caché en memoria (TTL 1s) para forzar re-listado
    await new Promise((r) => setTimeout(r, 1100))

    const second = await repo.findAll()
    expect(second).toHaveLength(1)
    expect(second[0].patente).toBe('AAAA-11')
  })

  it('detecta el blob legado con pathname fijo', async () => {
    const data = makeData()
    mockedList.mockResolvedValue({
      blobs: [
        {
          url: 'https://blob.example.com/db.json',
          pathname: 'db.json',
          uploadedAt: new Date().toISOString(),
          size: 100,
          etag: 'etag',
        },
      ],
      hasMore: false,
      cursor: undefined,
    } as never)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => data,
    } as never)
    vi.stubGlobal('fetch', fetchMock)

    const repo = new VercelBlobRepository()
    const result = await repo.findAll()

    expect(result).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledWith('https://blob.example.com/db.json')
  })
})
