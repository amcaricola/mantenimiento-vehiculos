import type { Vehiculo } from '../../shared/types.js'

export interface Storage {
  findAll(): Promise<Vehiculo[]>
  findById(id: string): Promise<Vehiculo | null>
  create(vehiculo: Vehiculo): Promise<Vehiculo>
  update(id: string, vehiculo: Vehiculo): Promise<Vehiculo>
  remove(id: string): Promise<boolean>
  replaceAll(vehiculos: Vehiculo[]): Promise<void>
}
