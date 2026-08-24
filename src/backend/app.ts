import path from 'node:path'
import { Hono } from 'hono'
import type { AppContext } from './app.types'
import type { Env } from './config/env'
import { loadEnv } from './config/env'
import { JsonDbRepository } from './storage/json-db.repository'
import { createAuthService } from './modules/auth/auth.service'
import { getJwtExpirationSeconds } from './config/env'
import { createAuthController } from './modules/auth/auth.controller'
import { VehicleService } from './modules/vehicles/vehicle.service'
import { createVehicleController } from './modules/vehicles/vehicle.controller'
import { UploadService } from './modules/upload/upload.service'
import { createUploadController } from './modules/upload/upload.controller'
import { errorHandler } from './middleware/error.middleware'
import { createStaticHandler } from './middleware/static.middleware'

export interface AppDeps {
  repository?: JsonDbRepository
}

export async function createApp(env: Env = loadEnv(), deps: AppDeps = {}) {
  const repository =
    deps.repository ?? new JsonDbRepository(path.join(env.DATA_DIR, 'db.json'))
  await repository.init()

  const authService = createAuthService(
    env.MASTER_KEY,
    env.JWT_SECRET,
    getJwtExpirationSeconds(env.JWT_EXPIRES_IN),
  )
  const vehicleService = new VehicleService(repository)
  const uploadService = new UploadService(env.UPLOADS_DIR)

  const app = new Hono<AppContext>()

  app.use('*', async (c, next) => {
    c.set('authService', authService)
    c.set('vehicleService', vehicleService)
    c.set('uploadService', uploadService)
    await next()
  })

  app.onError(errorHandler)

  app.get('/api/health', (c) => c.json({ status: 'ok', version: 1 }))

  app.route('/api/auth', createAuthController())
  app.route('/api/vehicles', createVehicleController())
  app.route('/api/vehicles', createUploadController())

  app.use('*', createStaticHandler(env.PUBLIC_DIR, env.UPLOADS_DIR))

  return { app, env, repository }
}