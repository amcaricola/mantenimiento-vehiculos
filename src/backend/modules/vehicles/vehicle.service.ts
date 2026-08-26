import crypto from 'node:crypto'
import type {
  Vehiculo,
  VehiculoConEstado,
  RevisionConEstado,
} from '../../../shared/types.js'
import { getDiasRestantes, getRevisionStatus } from '../../../shared/dates.js'
import type { Storage } from '../../storage/storage.interface.js'
import type {
  ItemRevisionInput,
  VehiculoInput,
  VehiculoUpdateInput,
} from './vehicle.schema.js'

export class VehicleService {
  constructor(private readonly storage: Storage) {}

  async list(): Promise<VehiculoConEstado[]> {
    const vehiculos = await this.storage.findAll()
    return vehiculos.map((v) => enrichVehiculo(v))
  }

  async getById(id: string): Promise<VehiculoConEstado | null> {
    const vehiculo = await this.storage.findById(id)
    return vehiculo ? enrichVehiculo(vehiculo) : null
  }

  async create(input: VehiculoInput): Promise<Vehiculo> {
    const now = new Date().toISOString()
    const vehiculo: Vehiculo = {
      id: crypto.randomUUID(),
      patente: input.patente,
      marca: input.marca,
      modelo: input.modelo,
      tipo: input.tipo,
      fechaUltimaRevision: input.fechaUltimaRevision,
      revisiones: input.revisiones.map(normalizeRevision),
      createdAt: now,
      updatedAt: now,
    }
    return this.storage.create(vehiculo)
  }

  async update(id: string, input: VehiculoUpdateInput): Promise<Vehiculo | null> {
    const existing = await this.storage.findById(id)
    if (!existing) return null

    const updated: Vehiculo = {
      ...existing,
      ...(input.patente !== undefined && { patente: input.patente }),
      ...(input.marca !== undefined && { marca: input.marca }),
      ...(input.modelo !== undefined && { modelo: input.modelo }),
      ...(input.tipo !== undefined && { tipo: input.tipo }),
      ...(input.fechaUltimaRevision !== undefined && {
        fechaUltimaRevision: input.fechaUltimaRevision,
      }),
      ...(input.revisiones !== undefined && {
        revisiones: input.revisiones.map(normalizeRevision),
      }),
      updatedAt: new Date().toISOString(),
    }
    return this.storage.update(id, updated)
  }

  async remove(id: string): Promise<boolean> {
    return this.storage.remove(id)
  }

  async exportAll(): Promise<Vehiculo[]> {
    return this.storage.findAll()
  }

  async importAll(vehiculos: Vehiculo[]): Promise<{ count: number }> {
    const normalized = ensureUniqueIds(vehiculos)
    await this.storage.replaceAll(normalized)
    return { count: normalized.length }
  }

  async attachImage(
    vehicleId: string,
    revisionId: string,
    url: string,
  ): Promise<Vehiculo | null> {
    const existing = await this.storage.findById(vehicleId)
    if (!existing) return null
    const revision = existing.revisiones.find((r) => r.id === revisionId)
    if (!revision) return null
    revision.imagenRespaldoUrl = url
    existing.updatedAt = new Date().toISOString()
    return this.storage.update(vehicleId, existing)
  }

  async getImageUrl(
    vehicleId: string,
    revisionId: string,
  ): Promise<string | null | undefined> {
    const vehiculo = await this.storage.findById(vehicleId)
    if (!vehiculo) return undefined
    return vehiculo.revisiones.find((r) => r.id === revisionId)?.imagenRespaldoUrl
  }

  async clearImage(vehicleId: string, revisionId: string): Promise<Vehiculo | null> {
    const existing = await this.storage.findById(vehicleId)
    if (!existing) return null
    const revision = existing.revisiones.find((r) => r.id === revisionId)
    if (!revision) return null
    revision.imagenRespaldoUrl = null
    existing.updatedAt = new Date().toISOString()
    return this.storage.update(vehicleId, existing)
  }
}

export function normalizeRevision(
  input: ItemRevisionInput,
): Vehiculo['revisiones'][number] {
  return {
    id: input.id ?? crypto.randomUUID(),
    tipo: input.tipo,
    nombre: input.nombre,
    fechaProximaRevision: input.fechaProximaRevision,
    kilometrajeActual: input.kilometrajeActual,
    kilometrajeProximo: input.kilometrajeProximo,
    imagenRespaldoUrl: input.imagenRespaldoUrl ?? null,
    observaciones: input.observaciones,
  }
}

export function enrichVehiculo(
  vehiculo: Vehiculo,
  hoy: Date = new Date(),
): VehiculoConEstado {
  const revisiones: RevisionConEstado[] = vehiculo.revisiones.map((revision) => {
    const diasRestantes = getDiasRestantes(revision.fechaProximaRevision, hoy)
    return {
      ...revision,
      diasRestantes,
      estado: getRevisionStatus(diasRestantes),
    }
  })
  return { ...vehiculo, revisiones }
}

export function ensureUniqueIds(vehiculos: Vehiculo[]): Vehiculo[] {
  const usedVehicleIds = new Set<string>()
  return vehiculos.map((vehiculo) => {
    let vehicleId = vehiculo.id
    if (usedVehicleIds.has(vehicleId)) vehicleId = crypto.randomUUID()
    usedVehicleIds.add(vehicleId)

    const usedRevisionIds = new Set<string>()
    const revisiones = vehiculo.revisiones.map((revision) => {
      let revisionId = revision.id
      if (usedRevisionIds.has(revisionId)) revisionId = crypto.randomUUID()
      usedRevisionIds.add(revisionId)
      return { ...revision, id: revisionId }
    })

    return { ...vehiculo, id: vehicleId, revisiones }
  })
}