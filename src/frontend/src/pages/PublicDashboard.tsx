import { useVehicles } from '../hooks/useVehicles'
import { VehicleCard } from '../components/VehicleCard'

interface Props {
  search: string
}

export function PublicDashboard({ search }: Props) {
  const { vehicles, loading, error } = useVehicles(null)

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

  if (loading) {
    return <div className="mx-auto max-w-2xl p-4 text-center text-slate-500">Cargando vehículos…</div>
  }

  if (error) {
    return <div className="mx-auto max-w-2xl p-4 text-center text-red-600">{error}</div>
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No se encontraron vehículos.
        </div>
      ) : (
        filtered.map((vehiculo) => <VehicleCard key={vehiculo.id} vehiculo={vehiculo} />)
      )}
    </main>
  )
}