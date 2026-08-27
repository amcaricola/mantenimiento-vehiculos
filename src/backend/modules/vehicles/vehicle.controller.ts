import { Hono } from 'hono'
import type { Context } from 'hono'
import type { z } from 'zod'
import type { AppContext } from '../../app.types.js'
import type { VehiculoConEstado } from '../../../shared/types.js'
import { DB_VERSION } from '../../storage/json-db.repository.js'
import { ApiError } from '../../middleware/error.middleware.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import {
  vehiculoInputSchema,
  vehiculoUpdateSchema,
  importPayloadSchema,
} from './vehicle.schema.js'

function parseBodyOrThrow<S extends z.ZodTypeAny>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
      .join('; ')
    throw new ApiError(400, `Datos inválidos: ${issues}`)
  }
  return result.data
}

// Verifica si la petición trae un token válido. En modo público (sin sesión)
// las URLs de los respaldos NO se exponen; solo se indica si existe la foto.
async function hasValidToken(c: Context<AppContext>): Promise<boolean> {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) return false
  const authService = c.get('authService')
  return authService.verifyToken(header.slice('Bearer '.length))
}

function maskVehiculo(v: VehiculoConEstado): VehiculoConEstado {
  return {
    ...v,
    revisiones: v.revisiones.map((r) => ({
      ...r,
      imagenRespaldoUrl: null,
      tieneImagen: Boolean(r.imagenRespaldoUrl),
    })),
  }
}

export function createVehicleController() {
  const app = new Hono<AppContext>()

  app.get('/', async (c) => {
    const service = c.get('vehicleService')
    const vehiculos = await service.list()
    if (await hasValidToken(c)) return c.json(vehiculos)
    return c.json(vehiculos.map(maskVehiculo))
  })

  app.get('/export', authMiddleware(), async (c) => {
    const service = c.get('vehicleService')
    const vehiculos = await service.exportAll()
    return c.json({
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      vehiculos,
    })
  })

  app.post('/import', authMiddleware(), async (c) => {
    const input = parseBodyOrThrow(importPayloadSchema, await c.req.json())
    const vehiculos = Array.isArray(input) ? input : input.vehiculos
    const service = c.get('vehicleService')
    const result = await service.importAll(vehiculos)
    return c.json({ imported: result.count })
  })

  app.get('/:id', async (c) => {
    const service = c.get('vehicleService')
    const vehiculo = await service.getById(c.req.param('id'))
    if (!vehiculo) {
      throw new ApiError(404, 'Vehículo no encontrado')
    }
    if (await hasValidToken(c)) return c.json(vehiculo)
    return c.json(maskVehiculo(vehiculo))
  })

  app.post('/', authMiddleware(), async (c) => {
    const input = parseBodyOrThrow(vehiculoInputSchema, await c.req.json())
    const service = c.get('vehicleService')
    const vehiculo = await service.create(input)
    return c.json(vehiculo, 201)
  })

  app.put('/:id', authMiddleware(), async (c) => {
    const input = parseBodyOrThrow(vehiculoUpdateSchema, await c.req.json())
    const service = c.get('vehicleService')
    const vehiculo = await service.update(c.req.param('id'), input)
    if (!vehiculo) {
      throw new ApiError(404, 'Vehículo no encontrado')
    }
    return c.json(vehiculo)
  })

  app.delete('/:id', authMiddleware(), async (c) => {
    const service = c.get('vehicleService')
    const removed = await service.remove(c.req.param('id'))
    if (!removed) {
      throw new ApiError(404, 'Vehículo no encontrado')
    }
    return c.body(null, 204)
  })

  return app
}