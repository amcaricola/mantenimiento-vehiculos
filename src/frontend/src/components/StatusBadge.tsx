import type { RevisionStatus } from '../../../shared/types'

const DOT_COLORS: Record<RevisionStatus, { color: string; label: string }> = {
  vencido: { color: 'bg-red-500', label: 'Vencido' },
  proximo: { color: 'bg-amber-500', label: 'Próximo a vencer' },
  al_dia: { color: 'bg-emerald-500', label: 'Al día' },
  sin_fecha: { color: 'bg-slate-400', label: 'Sin fecha' },
}

export function StatusBadge({ status }: { status: RevisionStatus }) {
  const config = DOT_COLORS[status] ?? DOT_COLORS.sin_fecha
  return (
    <span
      className={`inline-block h-3 w-3 shrink-0 rounded-full ${config.color}`}
      title={config.label}
      aria-label={config.label}
    />
  )
}