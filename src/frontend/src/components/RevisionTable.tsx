import type { RevisionConEstado } from '../../../shared/types.js'
import { DIAS_MARGEN_AVISO } from '../../../shared/types.js'
import { formatDateShort, formatDiasRestantes } from '../utils/dateUtils.js'
import { StatusBadge } from './StatusBadge.js'

interface Props {
  revisiones: RevisionConEstado[]
  onViewImage: (url: string, nombre: string) => void
}

function PhotoIcon({ hasPhoto }: { hasPhoto: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={hasPhoto ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 ${hasPhoto ? '' : 'opacity-50'}`}
      aria-hidden="true"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function PhotoButton({ rev, onViewImage }: { rev: RevisionConEstado; onViewImage: Props['onViewImage'] }) {
  return (
    <button
      type="button"
      aria-label={
        rev.imagenRespaldoUrl
          ? `Ver foto de ${rev.nombre}`
          : `Sin foto de ${rev.nombre}`
      }
      disabled={!rev.imagenRespaldoUrl}
      onClick={() =>
        rev.imagenRespaldoUrl && onViewImage(rev.imagenRespaldoUrl, rev.nombre)
      }
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
        rev.imagenRespaldoUrl
          ? 'text-brand-600 hover:bg-slate-100 active:bg-slate-200'
          : 'cursor-not-allowed text-slate-400'
      }`}
    >
      <PhotoIcon hasPhoto={Boolean(rev.imagenRespaldoUrl)} />
    </button>
  )
}

function diasClassName(dias: number | null): string {
  if (dias !== null && dias < 0) return 'text-red-600'
  if (dias !== null && dias <= DIAS_MARGEN_AVISO) return 'text-amber-600'
  return 'text-slate-700'
}

const GRID_COLS = 'sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]'

export function RevisionTable({ revisiones, onViewImage }: Props) {
  if (revisiones.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-slate-500">
        Sin revisiones registradas
      </p>
    )
  }

  const kilometraje = revisiones.find((r) => r.tipo === 'kilometraje')
  const filas = revisiones.filter((r) => r.tipo !== 'kilometraje')

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div
          className={`hidden border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs uppercase tracking-wide text-slate-500 sm:grid ${GRID_COLS} sm:gap-3`}
        >
          <span className="font-semibold">Revisión</span>
          <span className="font-semibold">Próx. revisión</span>
          <span className="font-semibold">Días</span>
          <span className="text-right font-semibold">Estado</span>
        </div>

        <div className="divide-y divide-slate-100 sm:divide-y-0">
          {filas.map((rev) => (
            <div
              key={rev.id}
              className={`px-3 py-3 sm:grid ${GRID_COLS} sm:items-center sm:gap-3`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800">{rev.nombre}</div>
                  {rev.observaciones && (
                    <div className="text-xs text-slate-500">{rev.observaciones}</div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
                  <StatusBadge status={rev.estado} />
                  <PhotoButton rev={rev} onViewImage={onViewImage} />
                </div>
              </div>

              <div className="mt-1 text-sm text-slate-600 sm:mt-0">
                <span className="mr-1 text-xs text-slate-400 sm:hidden">Próx.:</span>
                {formatDateShort(rev.fechaProximaRevision)}
              </div>

              <div className="mt-0.5 text-sm sm:mt-0">
                <span className="mr-1 text-xs text-slate-400 sm:hidden">Días:</span>
                <span className={`font-semibold ${diasClassName(rev.diasRestantes)}`}>
                  {formatDiasRestantes(rev.diasRestantes)}
                </span>
              </div>

              <div className="hidden items-center justify-end gap-2 sm:flex">
                <StatusBadge status={rev.estado} />
                <PhotoButton rev={rev} onViewImage={onViewImage} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {kilometraje && (
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-800">{kilometraje.nombre}</div>
            {kilometraje.observaciones && (
              <div className="text-xs text-slate-500">{kilometraje.observaciones}</div>
            )}
            <div className="mt-0.5 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Km actual:</span>{' '}
              {formatKm(kilometraje.kilometrajeActual)}
              <span className="mx-1 text-slate-400">→</span>
              <span className="font-medium text-slate-700">Km próximo:</span>{' '}
              {formatKm(kilometraje.kilometrajeProximo)}
            </div>
          </div>
          <PhotoButton rev={kilometraje} onViewImage={onViewImage} />
        </div>
      )}
    </div>
  )
}

function formatKm(value: number | undefined): string {
  if (value === undefined) return '—'
  return value.toLocaleString('es-CL')
}