import crypto from 'node:crypto'
import type { ItemRevision, TipoRevision, Vehiculo } from '../../shared/types'
import { NOMBRES_REVISION } from '../../shared/types'

function isoFromOffset(days: number, base: Date = new Date()): string {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildRevision(
  tipo: TipoRevision,
  fechaProxima: string | undefined,
  extras: Partial<ItemRevision> = {},
): ItemRevision {
  return {
    id: crypto.randomUUID(),
    tipo,
    nombre: NOMBRES_REVISION[tipo],
    fechaProximaRevision: fechaProxima,
    ...extras,
  }
}

function createSeedVehiculo(partial: Partial<Vehiculo>): Vehiculo {
  const now = new Date()
  return {
    id: crypto.randomUUID(),
    patente: 'XXXX-00',
    marca: 'Marca',
    modelo: 'Modelo',
    tipo: 'Automóvil',
    revisiones: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...partial,
  }
}

export function seedVehiculos(): Vehiculo[] {
  const vehiculoA = createSeedVehiculo({
    patente: 'ABCD-12',
    marca: 'Toyota',
    modelo: 'Hilux',
    tipo: 'Camioneta',
    fechaUltimaRevision: isoFromOffset(-10),
    revisiones: [
      buildRevision('seguro', isoFromOffset(30)),
      buildRevision('permiso_circulacion', isoFromOffset(300)),
      buildRevision('revision_tecnica', isoFromOffset(35)),
      buildRevision('revision_gas', isoFromOffset(-5)),
      buildRevision('pastillas_freno', isoFromOffset(60), {
        observaciones: 'Revisar próximamente',
      }),
      buildRevision('kilometraje', undefined, {
        kilometrajeActual: 48500,
        kilometrajeProximo: 60000,
      }),
    ],
  })

  const vehiculoB = createSeedVehiculo({
    patente: 'XYZW-34',
    marca: 'Hyundai',
    modelo: 'HD78',
    tipo: 'Furgón',
    fechaUltimaRevision: isoFromOffset(-45),
    revisiones: [
      buildRevision('seguro', isoFromOffset(215)),
      buildRevision('permiso_circulacion', isoFromOffset(335)),
      buildRevision('revision_tecnica', isoFromOffset(348)),
      buildRevision('revision_gas', isoFromOffset(80)),
      buildRevision('pastillas_freno', isoFromOffset(15)),
      buildRevision('kilometraje', undefined, {
        kilometrajeActual: 72300,
        kilometrajeProximo: 80000,
      }),
    ],
  })

  return [vehiculoA, vehiculoB]
}