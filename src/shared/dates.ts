import { DIAS_MARGEN_AVISO, type RevisionStatus } from './types.js'

const MS_PER_DAY = 86_400_000

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function parseISODateLocal(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function differenceInDays(fechaISO: string, hoy: Date): number {
  const target = startOfDay(parseISODateLocal(fechaISO))
  const today = startOfDay(hoy)
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY)
}

export function getDiasRestantes(
  fechaProximaRevision: string | undefined,
  hoy: Date = new Date(),
): number | null {
  if (!fechaProximaRevision) return null
  return differenceInDays(fechaProximaRevision, hoy)
}

export function getRevisionStatus(
  diasRestantes: number | null,
  diasMargenAviso: number = DIAS_MARGEN_AVISO,
): RevisionStatus {
  if (diasRestantes === null) return 'sin_fecha'
  if (diasRestantes < 0) return 'vencido'
  if (diasRestantes <= diasMargenAviso) return 'proximo'
  return 'al_dia'
}

export function formatDiasRestantes(dias: number | null): string {
  if (dias === null) return '—'
  if (dias === 0) return 'Hoy'
  if (dias === 1) return '1 día'
  if (dias < 0) return `${Math.abs(dias)} días vencido`
  return `${dias} días`
}

export function formatDateShort(iso: string | undefined): string {
  if (!iso) return '—'
  return parseISODateLocal(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
