import type { Vehiculo } from '../../shared/types.js'
import type { Storage } from './storage.interface.js'
import { seedVehiculos } from './seed.js'

export class InMemoryRepository implements Storage {
  private vehiculos: Vehiculo[] = seedVehiculos()

  async findAll(): Promise<Vehiculo[]> {
    return [...this.vehiculos]
  }

  async findById(id: string): Promise<Vehiculo | null> {
    return this.vehiculos.find((v) => v.id === id) ?? null
  }

  async create(vehiculo: Vehiculo): Promise<Vehiculo> {
    this.vehiculos.push(vehiculo)
    return vehiculo
  }

  async update(id: string, vehiculo: Vehiculo): Promise<Vehiculo> {
    const index = this.vehiculos.findIndex((v) => v.id === id)
    if (index === -1) {
      throw new Error(`Vehículo ${id} no encontrado`)
    }
    this.vehiculos[index] = vehiculo
    return vehiculo
  }

  async remove(id: string): Promise<boolean> {
    const index = this.vehiculos.findIndex((v) => v.id === id)
    if (index === -1) return false
    this.vehiculos.splice(index, 1)
    return true
  }

  async replaceAll(vehiculos: Vehiculo[]): Promise<void> {
    this.vehiculos = vehiculos
  }
}