interface Props {
  isAdmin: boolean
  onToggleAdmin: () => void
  onLogout: () => void
  search: string
  onSearchChange: (value: string) => void
}

export function Header({ isAdmin, onToggleAdmin, onLogout, search, onSearchChange }: Props) {
  const hoy = new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <header className="sticky top-0 z-40 border-b border-brand-700 bg-brand-600 text-white shadow-sm">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl">
          🚚
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold leading-tight">
            Mantenimiento de Vehículos
          </h1>
          <p className="text-xs text-white/80">
            {isAdmin ? 'Modo edición activo' : 'Modo revisión'} · {hoy}
          </p>
        </div>
        {isAdmin ? (
          <button type="button" onClick={onLogout} className="btn-outline !min-h-[40px] !border-white/40 !bg-white/10 !px-3 !text-xs !text-white">
            Salir
          </button>
        ) : (
          <button type="button" onClick={onToggleAdmin} className="btn-outline !min-h-[40px] !border-white/40 !bg-white/10 !px-3 !text-xs !text-white">
            Modo edición
          </button>
        )}
      </div>
      <div className="mx-auto max-w-2xl px-4 pb-3">
        <input
          type="search"
          value={search}
          onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
          placeholder="Buscar por patente, marca o modelo…"
          className="input !rounded-full !border-transparent !py-2.5 text-slate-800"
        />
      </div>
    </header>
  )
}