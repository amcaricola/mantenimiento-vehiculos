import { useState } from 'preact/hooks'

interface Props {
  onCancel: () => void
  onSubmit: (masterKey: string) => Promise<void>
}

export function MasterKeyModal({ onCancel, onSubmit }: Props) {
  const [masterKey, setMasterKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (!masterKey) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(masterKey)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clave incorrecta')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Ingreso de clave maestra"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-2xl">
            🔐
          </div>
          <h2 className="text-lg font-bold text-slate-900">Modo edición</h2>
          <p className="text-sm text-slate-500">
            Ingresa la clave maestra para administrar los vehículos.
          </p>
        </div>

        <label className="label" htmlFor="master-key">
          Clave maestra
        </label>
        <input
          id="master-key"
          type="password"
          autoFocus
          value={masterKey}
          onInput={(e) => setMasterKey((e.target as HTMLInputElement).value)}
          className="input text-center tracking-widest"
          placeholder="••••••••"
          autoComplete="current-password"
        />

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button type="button" className="btn-outline flex-1" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={submitting}>
            {submitting ? 'Verificando…' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  )
}