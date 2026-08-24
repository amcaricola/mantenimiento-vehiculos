import { useCallback, useEffect, useState } from 'preact/hooks'
import type { Vehiculo, VehiculoConEstado } from '../../../shared/types'
import { getDiasRestantes, getRevisionStatus } from '../../../shared/dates'
import { api } from '../services/api'

function toVehiculoConEstado(v: Vehiculo): VehiculoConEstado {
  return {
    ...v,
    revisiones: v.revisiones.map((r) => {
      const diasRestantes = getDiasRestantes(r.fechaProximaRevision)
      return {
        ...r,
        diasRestantes,
        estado: getRevisionStatus(diasRestantes),
      }
    }),
  }
}

export function useVehicles(token: string | null) {
  const [vehicles, setVehicles] = useState<VehiculoConEstado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getVehicles(token)
      setVehicles(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar vehículos')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addVehicle = useCallback(
    async (data: Record<string, unknown>) => {
      if (!token) throw new Error('Sin sesión')
      const vehiculo = await api.createVehicle(data, token)
      setVehicles((prev) => [...prev, toVehiculoConEstado(vehiculo)])
      return vehiculo
    },
    [token],
  )

  const updateVehicle = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      if (!token) throw new Error('Sin sesión')
      const vehiculo = await api.updateVehicle(id, data, token)
      setVehicles((prev) =>
        prev.map((v) => (v.id === id ? toVehiculoConEstado(vehiculo) : v)),
      )
      return vehiculo
    },
    [token],
  )

  const removeVehicle = useCallback(
    async (id: string) => {
      if (!token) throw new Error('Sin sesión')
      await api.deleteVehicle(id, token)
      setVehicles((prev) => prev.filter((v) => v.id !== id))
    },
    [token],
  )

  const uploadImage = useCallback(
    async (vehicleId: string, revisionId: string, file: File) => {
      if (!token) throw new Error('Sin sesión')
      const { vehiculo } = await api.uploadImage(vehicleId, revisionId, file, token)
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? toVehiculoConEstado(vehiculo) : v)),
      )
      return vehiculo
    },
    [token],
  )

  const deleteImage = useCallback(
    async (vehicleId: string, revisionId: string) => {
      if (!token) throw new Error('Sin sesión')
      const { vehiculo } = await api.deleteImage(vehicleId, revisionId, token)
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? toVehiculoConEstado(vehiculo) : v)),
      )
      return vehiculo
    },
    [token],
  )

  return {
    vehicles,
    loading,
    error,
    refresh,
    addVehicle,
    updateVehicle,
    removeVehicle,
    uploadImage,
    deleteImage,
  }
}