import path from 'node:path'
import { Hono } from 'hono'
import type { AppContext } from './app.types.js'
import type { Env } from './config/env.js'
import { loadEnv } from './config/env.js'
import type { Storage } from './storage/storage.interface.js'
import { JsonDbRepository } from './storage/json-db.repository.js'
import { VercelBlobRepository } from './storage/vercel-blob.repository.js'
import { createAuthService } from './modules/auth/auth.service.js'
import { getJwtExpirationSeconds } from './config/env.js'
import { createAuthController } from './modules/auth/auth.controller.js'
import { VehicleService } from './modules/vehicles/vehicle.service.js'
import { createVehicleController } from './modules/vehicles/vehicle.controller.js'
import { UploadService, type UploadServiceContract } from './modules/upload/upload.service.js'
import { VercelBlobUploadService } from './modules/upload/vercel-blob.upload.service.js'
import { createUploadController } from './modules/upload/upload.controller.js'
import { errorHandler } from './middleware/error.middleware.js'
import { createStaticHandler } from './middleware/static.middleware.js'

export function isVercel(): boolean {
  return process.env.VERCEL === '1'
}

export interface AppDeps {
  repository?: Storage
  uploadService?: UploadServiceContract
  mountStatic?: boolean
}

export interface AppBundle {
  app: Hono<AppContext>
  env: Env
  repository: Storage
}

export function createApp(env: Env = loadEnv(), deps: AppDeps = {}): AppBundle {
  const runningOnVercel = isVercel()

  const repository =
    deps.repository ??
    (runningOnVercel
      ? new VercelBlobRepository()
      : new JsonDbRepository(path.join(env.DATA_DIR, 'db.json')))

  const uploadService =
    deps.uploadService ??
    (runningOnVercel
      ? new VercelBlobUploadService()
      : new UploadService(env.UPLOADS_DIR))

  const authService = createAuthService(
    env.MASTER_KEY,
    env.JWT_SECRET,
    getJwtExpirationSeconds(env.JWT_EXPIRES_IN),
  )
  const vehicleService = new VehicleService(repository)

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

  // En Vercel los estáticos los sirve el CDN (carpeta public/); el middleware
  // local de estáticos solo se monta en el servidor Node.js (npm start / dev).
  const mountStatic = deps.mountStatic ?? !runningOnVercel
  if (mountStatic) {
    app.use('*', createStaticHandler(env.PUBLIC_DIR, env.UPLOADS_DIR))
  }

  return { app, env, repository }
}