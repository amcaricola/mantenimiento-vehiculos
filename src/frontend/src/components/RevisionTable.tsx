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

function formatKm(value: number | undefined): string {
  if (value === undefined) return '—'
  return value.toLocaleString('es-CL')
}

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
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-semibold">Revisión</th>
              <th className="px-3 py-2 font-semibold">Próx. revisión</th>
              <th className="px-3 py-2 font-semibold">Días</th>
              <th className="px-3 py-2 text-right font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((rev) => (
              <tr key={rev.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-3 py-3">
                  <div className="font-semibold text-slate-800">{rev.nombre}</div>
                  {rev.observaciones && (
                    <div className="text-xs text-slate-500">{rev.observaciones}</div>
                  )}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {formatDateShort(rev.fechaProximaRevision)}
                </td>
                <td className="px-3 py-3 font-semibold">
                  <span
                    className={
                      rev.diasRestantes !== null && rev.diasRestantes < 0
                        ? 'text-red-600'
                        : rev.diasRestantes !== null &&
                            rev.diasRestantes <= DIAS_MARGEN_AVISO
                          ? 'text-amber-600'
                          : 'text-slate-700'
                    }
                  >
                    {formatDiasRestantes(rev.diasRestantes)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <StatusBadge status={rev.estado} />
                    <button
                      type="button"
                      aria-label={
                        rev.imagenRespaldoUrl
                          ? `Ver foto de ${rev.nombre}`
                          : `Sin foto de ${rev.nombre}`
                      }
                      disabled={!rev.imagenRespaldoUrl}
                      onClick={() =>
                        rev.imagenRespaldoUrl &&
                        onViewImage(rev.imagenRespaldoUrl, rev.nombre)
                      }
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        rev.imagenRespaldoUrl
                          ? 'text-brand-600 hover:bg-slate-100 active:bg-slate-200'
                          : 'cursor-not-allowed text-slate-400'
                      }`}
                    >
                      <PhotoIcon hasPhoto={Boolean(rev.imagenRespaldoUrl)} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          <button
            type="button"
            aria-label={
              kilometraje.imagenRespaldoUrl
                ? `Ver foto de ${kilometraje.nombre}`
                : `Sin foto de ${kilometraje.nombre}`
            }
            disabled={!kilometraje.imagenRespaldoUrl}
            onClick={() =>
              kilometraje.imagenRespaldoUrl &&
              onViewImage(kilometraje.imagenRespaldoUrl, kilometraje.nombre)
            }
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              kilometraje.imagenRespaldoUrl
                ? 'text-brand-600 hover:bg-slate-100 active:bg-slate-200'
                : 'cursor-not-allowed text-slate-400'
            }`}
          >
            <PhotoIcon hasPhoto={Boolean(kilometraje.imagenRespaldoUrl)} />
          </button>
        </div>
      )}
    </div>
  )
}