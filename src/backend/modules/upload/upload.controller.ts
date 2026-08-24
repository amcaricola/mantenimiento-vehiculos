import { Hono } from 'hono'
import type { AppContext } from '../../app.types'
import { ApiError } from '../../middleware/error.middleware'
import { authMiddleware } from '../../middleware/auth.middleware'

export function createUploadController() {
  const app = new Hono<AppContext>()

  app.post('/:vehicleId/revision/:revisionId/image', authMiddleware(), async (c) => {
    const { vehicleId, revisionId } = c.req.param()
    const body = await c.req.parseBody()
    const file = body['image']

    if (!(file instanceof File)) {
      throw new ApiError(400, 'Archivo de imagen requerido (campo "image")')
    }

    const vehicleService = c.get('vehicleService')
    const existingUrl = await vehicleService.getImageUrl(vehicleId, revisionId)
    const uploadService = c.get('uploadService')

    const url = await uploadService.save(file)
    const updated = await vehicleService.attachImage(vehicleId, revisionId, url)
    if (!updated) {
      await uploadService.removeByUrl(url)
      throw new ApiError(404, 'Vehículo o revisión no encontrados')
    }

    if (existingUrl && existingUrl !== url) {
      await uploadService.removeByUrl(existingUrl)
    }

    return c.json({ vehiculo: updated, url }, 201)
  })

  app.delete('/:vehicleId/revision/:revisionId/image', authMiddleware(), async (c) => {
    const { vehicleId, revisionId } = c.req.param()
    const vehicleService = c.get('vehicleService')
    const uploadService = c.get('uploadService')

    const existingUrl = await vehicleService.getImageUrl(vehicleId, revisionId)
    const updated = await vehicleService.clearImage(vehicleId, revisionId)
    if (!updated) {
      throw new ApiError(404, 'Vehículo o revisión no encontrados')
    }
    if (existingUrl) {
      await uploadService.removeByUrl(existingUrl)
    }
    return c.json({ vehiculo: updated })
  })

  return app
}