import fs from 'node:fs/promises'
import path from 'node:path'
import type { DatabaseSchema, Vehiculo } from '../../shared/types.js'
import type { Storage } from './storage.interface.js'
import { seedVehiculos } from './seed.js'

export const DB_VERSION = 1

export class JsonDbRepository implements Storage {
  private readonly filePath: string
  private writeQueue: Promise<unknown> = Promise.resolve()

  constructor(filePath: string) {
    this.filePath = filePath
  }

  async init(): Promise<void> {
    await this.seedIfMissing()
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
  }

  private async seedIfMissing(): Promise<void> {
    await this.ensureDir()
    try {
      await fs.access(this.filePath)
    } catch {
      await this.writeRaw({ version: DB_VERSION, vehiculos: seedVehiculos() })
    }
  }

  private async readRaw(): Promise<DatabaseSchema> {
    await this.seedIfMissing()
    const content = await fs.readFile(this.filePath, 'utf-8')
    return JSON.parse(content) as DatabaseSchema
  }

  private async writeRaw(data: DatabaseSchema): Promise<void> {
    await this.ensureDir()
    const tmpFile = `${this.filePath}.${process.pid}.tmp`
    await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf-8')
    await fs.rename(tmpFile, this.filePath)
  }

  private enqueueWrite(data: DatabaseSchema): Promise<void> {
    const operation = this.writeQueue.then(() => this.writeRaw(data))
    this.writeQueue = operation.catch(() => undefined)
    return operation
  }

  async findAll(): Promise<Vehiculo[]> {
    const db = await this.readRaw()
    return db.vehiculos
  }

  async findById(id: string): Promise<Vehiculo | null> {
    const db = await this.readRaw()
    return db.vehiculos.find((v) => v.id === id) ?? null
  }

  async create(vehiculo: Vehiculo): Promise<Vehiculo> {
    const db = await this.readRaw()
    db.vehiculos.push(vehiculo)
    await this.enqueueWrite(db)
    return vehiculo
  }

  async update(id: string, vehiculo: Vehiculo): Promise<Vehiculo> {
    const db = await this.readRaw()
    const index = db.vehiculos.findIndex((v) => v.id === id)
    if (index === -1) {
      throw new Error(`Vehículo ${id} no encontrado`)
    }
    db.vehiculos[index] = vehiculo
    await this.enqueueWrite(db)
    return vehiculo
  }

  async remove(id: string): Promise<boolean> {
    const db = await this.readRaw()
    const initial = db.vehiculos.length
    db.vehiculos = db.vehiculos.filter((v) => v.id !== id)
    if (db.vehiculos.length === initial) return false
    await this.enqueueWrite(db)
    return true
  }

  async replaceAll(vehiculos: Vehiculo[]): Promise<void> {
    const db = await this.readRaw()
    db.vehiculos = vehiculos
    await this.enqueueWrite(db)
  }
}
