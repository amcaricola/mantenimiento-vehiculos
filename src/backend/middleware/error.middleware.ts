import type { ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof ApiError) {
    console.warn(`[ApiError] ${c.req.method} ${c.req.url}: ${err.status} - ${err.message}`)
    return c.json(
      { error: err.message },
      err.status as ContentfulStatusCode,
    )
  }
  console.error('[ErrorHandler]', err)
  return c.json({ error: 'Error interno del servidor' }, 500)
}