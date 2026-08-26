import { useRef, useState } from 'preact/hooks'
import type { VehiculoConEstado } from '../../../shared/types.js'
import { useVehicles } from '../hooks/useVehicles.js'
import { VehicleCard } from '../components/VehicleCard.js'
import { EditVehicleModal } from '../components/EditVehicleModal.js'

interface Props {
  token: string
  search: string
}

export function AdminDashboard({ token, search }: Props) {
  const {
    vehicles,
    loading,
    error,
    addVehicle,
    updateVehicle,
    removeVehicle,
    uploadImage,
    deleteImage,
    exportVehicles,
    importVehicles,
  } = useVehicles(token)

  const [editing, setEditing] = useState<VehiculoConEstado | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<VehiculoConEstado | null>(null)
  const [backupMsg, setBackupMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = vehicles.filter((v) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      v.patente.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      v.tipo.toLowerCase().includes(q)
    )
  })

  async function handleSave(data: Record<string, unknown>) {
    if (editing) {
      return updateVehicle(editing.id, data)
    }
    return addVehicle(data)
  }

  async function handleDelete() {
    if (!deleting) return
    await removeVehicle(deleting.id)
    setDeleting(null)
  }

  async function handleExport() {
    setBackupMsg(null)
    try {
      const data = await exportVehicles()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `respaldo-vehiculos-${data.exportedAt.slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setBackupMsg('Respaldo exportado correctamente')
    } catch (err) {
      setBackupMsg(err instanceof Error ? err.message : 'Error al exportar')
    }
  }

  async function handleImportFile(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    const confirmed = window.confirm(
      'Se reemplazarán todos los vehículos actuales con los datos del archivo. ¿Continuar?',
    )
    if (!confirmed) return

    setBackupMsg(null)
    try {
      const text = await file.text()
      const payload = JSON.parse(text)
      const result = await importVehicles(payload)
      setBackupMsg(`Se importaron ${result.imported} vehículo(s) correctamente`)
    } catch (err) {
      setBackupMsg(err instanceof Error ? err.message : 'Archivo inválido')
    }
  }

  const modalOpen = creating || editing !== null

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
      {loading && <div className="text-center text-slate-500">Cargando vehículos…</div>}
      {error && <div className="rounded-xl bg-red-50 p-3 text-center text-red-600">{error}</div>}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No se encontraron vehículos.
        </div>
      )}

      {filtered.map((vehiculo) => (
        <VehicleCard
          key={vehiculo.id}
          vehiculo={vehiculo}
          admin
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      ))}

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-800">Respaldo de datos</h3>
        <p className="mt-1 text-xs text-slate-500">
          Exporta o importa la información de los vehículos en formato JSON.
        </p>
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn-outline flex-1" onClick={handleExport}>
            Exportar
          </button>
          <button
            type="button"
            className="btn-outline flex-1"
            onClick={() => fileInputRef.current?.click()}
          >
            Importar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
        {backupMsg && <p className="mt-2 text-xs text-slate-600">{backupMsg}</p>}
      </div>

      <button
        type="button"
        onClick={() => setCreating(true)}
        className="fixed bottom-6 right-4 z-30 flex h-14 items-center gap-2 rounded-full bg-brand-600 px-6 text-white shadow-lg shadow-brand-600/40 active:bg-brand-700"
      >
        <span className="text-xl leading-none">+</span>
        <span className="text-sm font-semibold">Agregar vehículo</span>
      </button>

      {modalOpen && (
        <EditVehicleModal
          vehiculo={editing}
          onSave={handleSave}
          onUpload={uploadImage}
          onDeleteImage={deleteImage}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}

      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Eliminar vehículo</h2>
            <p className="mt-2 text-sm text-slate-600">
              ¿Seguro que deseas eliminar <strong>{deleting.patente}</strong> ({deleting.marca}{' '}
              {deleting.modelo})? Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex gap-2">
              <button type="button" className="btn-outline flex-1" onClick={() => setDeleting(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-danger flex-1" onClick={handleDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}