import { list, put } from '@vercel/blob'
import type { DatabaseSchema, Vehiculo } from '../../shared/types'
import type { Storage } from './storage.interface'
import { seedVehiculos } from './seed'
import { DB_VERSION } from './json-db.repository'

const DB_PATHNAME = 'db.json'

export class VercelBlobRepository implements Storage {
  private url: string | null = null

  private async ensure(): Promise<void> {
    if (this.url) return
    const { blobs } = await list({ prefix: DB_PATHNAME, limit: 1 })
    if (blobs.length > 0) {
      this.url = blobs[0].url
      return
    }
    const data: DatabaseSchema = { version: DB_VERSION, vehiculos: seedVehiculos() }
    await this.write(data)
  }

  private async read(): Promise<DatabaseSchema> {
    await this.ensure()
    if (!this.url) {
      throw new Error('No se pudo inicializar la base de datos en Vercel Blob')
    }
    const res = await fetch(this.url)
    if (!res.ok) {
      throw new Error(`Error al leer la base de datos remota (${res.status})`)
    }
    return (await res.json()) as DatabaseSchema
  }

  private async write(data: DatabaseSchema): Promise<void> {
    const res = await put(DB_PATHNAME, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    })
    this.url = res.url
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