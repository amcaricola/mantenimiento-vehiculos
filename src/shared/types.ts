export const TIPOS_REVISION = [
  'seguro',
  'permiso_circulacion',
  'revision_tecnica',
  'revision_gas',
  'pastillas_freno',
  'kilometraje',
] as const

export type TipoRevision = (typeof TIPOS_REVISION)[number]

export const DIAS_MARGEN_AVISO = 15

export const NOMBRES_REVISION: Record<TipoRevision, string> = {
  seguro: 'Seguro Obligatorio (SOAP)',
  permiso_circulacion: 'Permiso de Circulación',
  revision_tecnica: 'Revisión Técnica',
  revision_gas: 'Revisión de Gas',
  pastillas_freno: 'Pastillas de Freno',
  kilometraje: 'Kilometraje',
}

export interface ItemRevision {
  id: string
  tipo: TipoRevision
  nombre: string
  fechaProximaRevision?: string
  kilometrajeActual?: number
  kilometrajeProximo?: number
  imagenRespaldoUrl?: string | null
  observaciones?: string
}

export interface Vehiculo {
  id: string
  patente: string
  marca: string
  modelo: string
  tipo: string
  fechaUltimaRevision?: string
  revisiones: ItemRevision[]
  createdAt: string
  updatedAt: string
}

export interface DatabaseSchema {
  version: number
  vehiculos: Vehiculo[]
}

export type RevisionStatus = 'vencido' | 'proximo' | 'al_dia' | 'sin_fecha'

export interface RevisionConEstado extends ItemRevision {
  diasRestantes: number | null
  estado: RevisionStatus
}

export interface VehiculoConEstado extends Vehiculo {
  revisiones: RevisionConEstado[]
}

export interface LoginResponse {
  token: string
  expiresAt: string
}