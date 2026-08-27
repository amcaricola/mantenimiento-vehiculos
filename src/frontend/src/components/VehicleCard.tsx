import { useState } from 'preact/hooks'
import type { RevisionStatus, VehiculoConEstado } from '../../../shared/types.js'
import { formatDateShort } from '../utils/dateUtils.js'
import { RevisionTable } from './RevisionTable.js'
import { ImagePreviewModal } from './ImagePreviewModal.js'

interface Props {
  vehiculo: VehiculoConEstado
  admin?: boolean
  onEdit?: (vehiculo: VehiculoConEstado) => void
  onDelete?: (vehiculo: VehiculoConEstado) => void
}

const GLOBAL_STATUS: Record<RevisionStatus, { label: string; badge: string; dot: string }> = {
  vencido: { label: 'Vencido', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  proximo: { label: 'Próximo', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  al_dia: { label: 'Al día', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  sin_fecha: { label: 'Sin fecha', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
}

export function VehicleCard({ vehiculo, admin = false, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [preview, setPreview] = useState<{ url: string | null; nombre: string } | null>(null)

  const worstStatus =
    vehiculo.revisiones
      .map((r) => r.estado)
      .sort((a, b) => orderOf(a) - orderOf(b))[0] ?? 'sin_fecha'

  const globalStatus = GLOBAL_STATUS[worstStatus]

  function orderOf(status: RevisionStatus): number {
    if (status === 'vencido') return 0
    if (status === 'proximo') return 1
    return 2
  }

  const statusColors: Record<string, string> = {
    vencido: 'bg-red-500',
    proximo: 'bg-amber-500',
    al_dia: 'bg-emerald-500',
    sin_fecha: 'bg-slate-400',
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
        aria-expanded={expanded}
      >
        <span
          className={`flex h-3 w-3 shrink-0 rounded-full ${statusColors[worstStatus]}`}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold tracking-wide text-slate-900">
            {vehiculo.patente}
          </span>
          <span className="block text-sm text-slate-600">
            {vehiculo.marca} {vehiculo.modelo}
          </span>
          <span className="block text-xs text-slate-500">{vehiculo.tipo}</span>
          {!expanded && (
            <span
              className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${globalStatus.badge}`}
            >
              <span className={`h-2 w-2 rounded-full ${globalStatus.dot}`} aria-hidden="true" />
              {globalStatus.label}
            </span>
          )}
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-xs text-slate-500">Últ. revisión</span>
          <span className="block text-sm font-semibold text-slate-800">
            {formatDateShort(vehiculo.fechaUltimaRevision)}
          </span>
        </span>
        <span
          className={`shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <RevisionTable
            revisiones={vehiculo.revisiones}
            onViewImage={(url, nombre) => setPreview({ url, nombre })}
          />
          {admin && (
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-primary flex-1" onClick={() => onEdit?.(vehiculo)}>
                Editar
              </button>
              <button type="button" className="btn-danger flex-1" onClick={() => onDelete?.(vehiculo)}>
                Eliminar
              </button>
            </div>
          )}
        </div>
      )}

      {preview && (
        <ImagePreviewModal
          url={preview.url}
          nombre={preview.nombre}
          onClose={() => setPreview(null)}
        />
      )}
    </article>
  )
}