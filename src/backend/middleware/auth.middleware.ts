import type { MiddlewareHandler } from 'hono'
import type { AppContext } from '../app.types.js'

export function authMiddleware(): MiddlewareHandler<AppContext> {
  return async (c, next) => {
    const header = c.req.header('Authorization')
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
    if (!token) {
      return c.json({ error: 'Token no proporcionado' }, 401)
    }
    const authService = c.get('authService')
    const valid = await authService.verifyToken(token)
    if (!valid) {
      return c.json({ error: 'Token inválido o expirado' }, 401)
    }
    await next()
  }
}