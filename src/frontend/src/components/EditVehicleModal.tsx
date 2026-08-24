import { useState } from 'preact/hooks'
import type { ItemRevision, TipoRevision, Vehiculo, VehiculoConEstado } from '../../../shared/types'
import { NOMBRES_REVISION, TIPOS_REVISION } from '../../../shared/types'

interface RevisionDraft extends Omit<ItemRevision, 'id'> {
  key: string
  id?: string
}

interface Props {
  vehiculo: VehiculoConEstado | null
  onSave: (data: Record<string, unknown>) => Promise<Vehiculo>
  onUpload: (vehicleId: string, revisionId: string, file: File) => Promise<unknown>
  onDeleteImage: (vehicleId: string, revisionId: string) => Promise<unknown>
  onClose: () => void
}

let counter = 0
function tempKey(): string {
  counter += 1
  return `temp-${counter}`
}

function emptyRevision(tipo: TipoRevision): RevisionDraft {
  return {
    key: tempKey(),
    tipo,
    nombre: NOMBRES_REVISION[tipo],
    observaciones: '',
  }
}

function buildRevisionDrafts(vehiculo: VehiculoConEstado | null): RevisionDraft[] {
  return TIPOS_REVISION.map((tipo) => {
    const existing = vehiculo?.revisiones.find((r) => r.tipo === tipo)
    if (!existing) return emptyRevision(tipo)
    return {
      key: existing.id,
      id: existing.id,
      tipo: existing.tipo,
      nombre: NOMBRES_REVISION[tipo],
      fechaProximaRevision: existing.fechaProximaRevision,
      kilometrajeActual: existing.kilometrajeActual,
      kilometrajeProximo: existing.kilometrajeProximo,
      imagenRespaldoUrl: existing.imagenRespaldoUrl,
      observaciones: existing.observaciones ?? '',
    }
  })
}

export function EditVehicleModal({ vehiculo, onSave, onUpload, onDeleteImage, onClose }: Props) {
  const isNew = vehiculo === null

  const [patente, setPatente] = useState(vehiculo?.patente ?? '')
  const [marca, setMarca] = useState(vehiculo?.marca ?? '')
  const [modelo, setModelo] = useState(vehiculo?.modelo ?? '')
  const [tipo, setTipo] = useState(vehiculo?.tipo ?? '')
  const [fechaUltimaRevision, setFechaUltimaRevision] = useState(
    vehiculo?.fechaUltimaRevision ?? '',
  )

  const [revisiones, setRevisiones] = useState<RevisionDraft[]>(() =>
    buildRevisionDrafts(vehiculo),
  )

  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function updateRevision(key: string, patch: Partial<RevisionDraft>) {
    setRevisiones((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    )
  }

  async function handleFile(key: string, file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('El archivo seleccionado no es una imagen')
      return
    }
    setPendingFiles((prev) => ({ ...prev, [key]: file }))
    setError(null)
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const data = buildPayload()
      const saved = await onSave(data)
      const savedIds = saved.revisiones.map((r) => r.id)
      for (const [key, file] of Object.entries(pendingFiles)) {
        const index = revisiones.findIndex((r) => r.key === key)
        const revisionId = savedIds[index]
        if (revisionId) {
          await onUpload(saved.id, revisionId, file)
        }
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  function buildPayload(): Record<string, unknown> {
    return {
      patente,
      marca,
      modelo,
      tipo,
      fechaUltimaRevision: fechaUltimaRevision || undefined,
      revisiones: revisiones.map((r) => ({
        ...(r.id ? { id: r.id } : {}),
        tipo: r.tipo,
        nombre: r.nombre,
        fechaProximaRevision: r.fechaProximaRevision || undefined,
        ...(r.tipo === 'kilometraje'
          ? {
              kilometrajeActual: r.kilometrajeActual,
              kilometrajeProximo: r.kilometrajeProximo,
            }
          : {}),
        observaciones: r.observaciones || undefined,
      })),
    }
  }

  async function handleRemoveImage(revision: RevisionDraft) {
    if (!vehiculo || !revision.id) return
    try {
      await onDeleteImage(vehiculo.id, revision.id)
      updateRevision(revision.key, { imagenRespaldoUrl: null })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la foto')
    }
  }

  function isKmBased(t: TipoRevision): boolean {
    return t === 'kilometraje'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? 'Nuevo vehículo' : 'Editar vehículo'}
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-slate-900">
          {isNew ? 'Nuevo vehículo' : `Editar ${vehiculo?.patente ?? ''}`}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-11 w-11 items-center justify-center rounded-full text-2xl text-slate-500 hover:bg-slate-100"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="edit-patente">Patente</label>
              <input id="edit-patente" className="input uppercase" value={patente} onInput={(e) => setPatente((e.target as HTMLInputElement).value)} placeholder="ABCD-12" required />
            </div>
            <div>
              <label className="label" htmlFor="edit-tipo">Tipo</label>
              <input id="edit-tipo" className="input" value={tipo} onInput={(e) => setTipo((e.target as HTMLInputElement).value)} placeholder="Camioneta" required />
            </div>
            <div>
              <label className="label" htmlFor="edit-marca">Marca</label>
              <input id="edit-marca" className="input" value={marca} onInput={(e) => setMarca((e.target as HTMLInputElement).value)} placeholder="Toyota" required />
            </div>
            <div>
              <label className="label" htmlFor="edit-modelo">Modelo</label>
              <input id="edit-modelo" className="input" value={modelo} onInput={(e) => setModelo((e.target as HTMLInputElement).value)} placeholder="Hilux" required />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="edit-fecha-ultima">Última revisión (general)</label>
              <input id="edit-fecha-ultima" type="date" className="input" value={fechaUltimaRevision} onInput={(e) => setFechaUltimaRevision((e.target as HTMLInputElement).value)} />
              <p className="mt-1 text-xs text-slate-500">
                Fecha del último chequeo general del vehículo.
              </p>
            </div>
          </div>

          <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-600">
            Items de revisión
          </h3>
          <p className="text-xs text-slate-500">
            Lista fija de revisiones del vehículo.
          </p>

          <div className="mt-3 space-y-4">
            {revisiones.map((rev) => (
              <section key={rev.key} className="rounded-xl border border-slate-200 bg-white p-3">
                <h4 className="text-sm font-bold text-slate-800">{rev.nombre}</h4>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  {!isKmBased(rev.tipo) ? (
                    <div className="col-span-2">
                      <label className="label">Próxima revisión</label>
                      <input type="date" className="input" value={rev.fechaProximaRevision ?? ''} onInput={(e) => updateRevision(rev.key, { fechaProximaRevision: (e.target as HTMLInputElement).value || undefined })} />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="label">Km actual</label>
                        <input type="number" inputMode="numeric" className="input" value={rev.kilometrajeActual ?? ''} onInput={(e) => updateRevision(rev.key, { kilometrajeActual: Number((e.target as HTMLInputElement).value) || undefined })} />
                      </div>
                      <div>
                        <label className="label">Km próximo</label>
                        <input type="number" inputMode="numeric" className="input" value={rev.kilometrajeProximo ?? ''} onInput={(e) => updateRevision(rev.key, { kilometrajeProximo: Number((e.target as HTMLInputElement).value) || undefined })} />
                      </div>
                    </>
                  )}
                  <div className="col-span-2">
                    <label className="label">Observaciones</label>
                    <input className="input" value={rev.observaciones ?? ''} onInput={(e) => updateRevision(rev.key, { observaciones: (e.target as HTMLInputElement).value })} placeholder="Opcional" />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-2">
                  {rev.imagenRespaldoUrl ? (
                    <>
                      <img src={rev.imagenRespaldoUrl} alt={`Respaldo ${rev.nombre}`} className="h-14 w-14 rounded-lg object-cover" />
                      <button type="button" className="btn-outline !min-h-[40px] !px-3 !text-xs" onClick={() => handleRemoveImage(rev)}>
                        Quitar foto
                      </button>
                    </>
                  ) : pendingFiles[rev.key] ? (
                    <>
                      <span className="text-xs font-medium text-slate-600">
                        📎 {pendingFiles[rev.key].name} (se subirá al guardar)
                      </span>
                      <button type="button" className="btn-outline !min-h-[40px] !px-3 !text-xs" onClick={() => setPendingFiles((p) => { const c = { ...p }; delete c[rev.key]; return c })}>
                        Quitar
                      </button>
                    </>
                  ) : (
                    <>
                      <label className="btn-outline !min-h-[40px] !flex-1 !px-3 !text-xs">
                        📷 Subir foto
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleFile(rev.key, (e.target as HTMLInputElement).files?.[0])}
                        />
                      </label>
                      <span className="text-[10px] leading-tight text-slate-400">
                        Máx 1 foto por revisión
                      </span>
                    </>
                  )}
                </div>
              </section>
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-4">
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Guardando…' : isNew ? 'Crear vehículo' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}