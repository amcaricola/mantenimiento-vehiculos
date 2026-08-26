import { Hono } from 'hono'
import type { z } from 'zod'
import type { AppContext } from '../../app.types.js'
import { ApiError } from '../../middleware/error.middleware.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import {
  vehiculoInputSchema,
  vehiculoUpdateSchema,
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

export function createVehicleController() {
  const app = new Hono<AppContext>()

  app.get('/', async (c) => {
    const service = c.get('vehicleService')
    return c.json(await service.list())
  })

  app.get('/:id', async (c) => {
    const service = c.get('vehicleService')
    const vehiculo = await service.getById(c.req.param('id'))
    if (!vehiculo) {
      throw new ApiError(404, 'Vehículo no encontrado')
    }
    return c.json(vehiculo)
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