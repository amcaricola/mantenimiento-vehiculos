import { list, put, del } from '@vercel/blob'
import type { DatabaseSchema, Vehiculo } from '../../shared/types.js'
import type { Storage } from './storage.interface.js'
import { DB_VERSION } from './json-db.repository.js'

// Cada escritura usa una URL única (addRandomSuffix) para evitar por completo
// la caché del CDN y la invalidación por sobrescritura del mismo pathname.
// OJO: addRandomSuffix inserta el sufijo ANTES de la extensión, por lo que
// "db.json" se convierte en "db-<aleatorio>.json" (NO "db.json-<aleatorio>").
// Por eso el prefijo de listado debe ser "db": detecta tanto el blob legado
// "db.json" como los generados "db-<aleatorio>.json". Un prefijo "db.json" NO
// encuentra los blobs reales y hace que una instancia nueva vea la DB vacía.
const DB_PATHNAME = 'db.json'
const DB_PREFIX = 'db'
const DB_LIST_LIMIT = 1000
const KEEP_LAST_BLOBS = 2
const DB_BLOB_PATTERN = /^db(?:-[^/]+)?\.json$/

// Caché en memoria por instancia: evita golpear el blob en cada request.
// Con un TTL de 1s las lecturas repetidas son instantáneas y el dato reflejado
// tiene como máximo 1s de antigüedad ("actualizado hace segundos" se ve en <1s).
const CACHE_TTL_MS = 1000

interface CacheEntry {
  data: DatabaseSchema
  at: number
}

export class VercelBlobRepository implements Storage {
  private url: string | null = null
  private empty = false
  private cache: CacheEntry | null = null

  private async ensure(): Promise<void> {
    // Solo una URL concreta evita volver a listar. El estado "empty" NO es
    // permanente: se re-listará en cada lectura (tras expirar la caché) para
    // rediscover datos creados por otra instancia o que aparezcan más tarde.
    if (this.url) return
    const { blobs } = await list({ prefix: DB_PREFIX, limit: DB_LIST_LIMIT })
    const databaseBlobs = blobs.filter((blob) => DB_BLOB_PATTERN.test(blob.pathname))
    if (databaseBlobs.length > 0) {
      const latest = [...databaseBlobs].sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
      )[0]
      this.url = latest.url
      this.empty = false
      return
    }
    // Sin base de datos previa: se trabaja con una DB limpia en memoria.
    // NO se persiste nada vacío hasta que el usuario guarde un cambio real,
    // para no crear un blob que pudiera ocultar datos legítimos.
    this.empty = true
  }

  private async read(): Promise<DatabaseSchema> {
    if (this.cache && Date.now() - this.cache.at < CACHE_TTL_MS) {
      return this.cache.data
    }
    await this.ensure()
    if (this.empty) {
      const data: DatabaseSchema = { version: DB_VERSION, vehiculos: [] }
      this.cache = { data, at: Date.now() }
      return data
    }
    if (!this.url) {
      throw new Error('No se pudo inicializar la base de datos en Vercel Blob')
    }
    let res = await fetch(this.url)
    if (res.status === 404) {
      // La URL fue reemplazada (otra instancia escribió y borró la anterior);
      // se relista el blob más reciente y se reintenta una vez.
      this.url = null
      await this.ensure()
      if (this.empty) {
        const data: DatabaseSchema = { version: DB_VERSION, vehiculos: [] }
        this.cache = { data, at: Date.now() }
        return data
      }
      if (!this.url) {
        throw new Error('No se pudo inicializar la base de datos en Vercel Blob')
      }
      res = await fetch(this.url)
    }
    if (!res.ok) {
      throw new Error(`Error al leer la base de datos remota (${res.status})`)
    }
    const data = (await res.json()) as DatabaseSchema
    this.cache = { data, at: Date.now() }
    return data
  }

  private async write(data: DatabaseSchema): Promise<void> {
    const res = await put(DB_PATHNAME, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
    })
    this.url = res.url
    this.empty = false
    this.cache = { data, at: Date.now() }
    await this.prune()
  }

  // Conserva solo los últimos blobs de la base (los más recientes) para evitar
  // acumulación. Nunca borra el recién escrito ni el inmediatamente anterior
  // (así una instancia con una URL ligeramente vieja aún puede leerlos).
  private async prune(): Promise<void> {
    try {
      const { blobs } = await list({ prefix: DB_PREFIX, limit: DB_LIST_LIMIT })
      const databaseBlobs = blobs.filter((blob) => DB_BLOB_PATTERN.test(blob.pathname))
      const sorted = [...databaseBlobs].sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
      )
      for (const b of sorted.slice(KEEP_LAST_BLOBS)) {
        if (b.url !== this.url) {
          try {
            await del(b.url)
          } catch {
            // otra instancia ya pudo eliminarlo
          }
        }
      }
    } catch {
      // el pruning no debe interrumpir la escritura
    }
  }

  async init(): Promise<void> {
    await this.ensure()
  }

  async findAll(): Promise<Vehiculo[]> {
    const db = await this.read()
    return db.vehiculos
  }

  async findById(id: string): Promise<Vehiculo | null> {
    const db = await this.read()
    return db.vehiculos.find((v) => v.id === id) ?? null
  }

  async create(vehiculo: Vehiculo): Promise<Vehiculo> {
    const db = await this.read()
    db.vehiculos.push(vehiculo)
    await this.write(db)
    return vehiculo
  }

  async update(id: string, vehiculo: Vehiculo): Promise<Vehiculo> {
    const db = await this.read()
    const index = db.vehiculos.findIndex((v) => v.id === id)
    if (index === -1) {
      throw new Error(`Vehículo ${id} no encontrado`)
    }
    db.vehiculos[index] = vehiculo
    await this.write(db)
    return vehiculo
  }

  async remove(id: string): Promise<boolean> {
    const db = await this.read()
    const initial = db.vehiculos.length
    db.vehiculos = db.vehiculos.filter((v) => v.id !== id)
    if (db.vehiculos.length === initial) return false
    await this.write(db)
    return true
  }

  async replaceAll(vehiculos: Vehiculo[]): Promise<void> {
    const db = await this.read()
    db.vehiculos = vehiculos
    await this.write(db)
  }
}
