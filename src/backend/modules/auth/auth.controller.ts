import { Hono } from 'hono'
import type { AppContext } from '../../app.types.js'
import { ApiError } from '../../middleware/error.middleware.js'

export function createAuthController() {
  const app = new Hono<AppContext>()

  app.post('/login', async (c) => {
    const body = await c.req.json().catch(() => null)
    const masterKey = body?.masterKey
    if (typeof masterKey !== 'string' || masterKey.length === 0) {
      throw new ApiError(400, 'La clave maestra es obligatoria')
    }
    const authService = c.get('authService')
    const session = await authService.createToken(masterKey)
    if (!session) {
      throw new ApiError(401, 'Clave maestra incorrecta')
    }
    return c.json(session)
  })

  app.get('/verify', async (c) => {
    const header = c.req.header('Authorization')
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
    if (!token) {
      return c.json({ valid: false })
    }
    const authService = c.get('authService')
    const valid = await authService.verifyToken(token)
    return c.json({ valid })
  })

  return app
}