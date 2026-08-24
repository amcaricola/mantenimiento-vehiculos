import fs from 'node:fs/promises'
import path from 'node:path'
import type { Context, MiddlewareHandler } from 'hono'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

async function sendFile(c: Context, filePath: string): Promise<Response> {
  try {
    const stat = await fs.stat(filePath)
    if (!stat.isFile()) {
      return c.json({ error: 'No encontrado' }, 404)
    }
    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'
    const content = await fs.readFile(filePath)
    return new Response(new Uint8Array(content), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stat.size),
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return c.json({ error: 'No encontrado' }, 404)
  }
}

export function createStaticHandler(publicDir: string, uploadsDir: string): MiddlewareHandler {
  return async (c, next) => {
    const url = new URL(c.req.url)

    if (url.pathname.startsWith('/api/')) {
      return next()
    }

    const isUpload = url.pathname.startsWith('/uploads/')
    const root = path.resolve(isUpload ? uploadsDir : publicDir)
    const relativePath = isUpload
      ? decodeURIComponent(url.pathname.slice('/uploads/'.length))
      : decodeURIComponent(url.pathname === '/' ? 'index.html' : url.pathname)

    const filePath = path.resolve(path.join(root, relativePath))
    if (filePath !== root && !filePath.startsWith(root + path.sep)) {
      return c.json({ error: 'Ruta inválida' }, 400)
    }

    const served = await sendFile(c, filePath)
    if (served.status !== 404) {
      return served
    }

    if (!isUpload) {
      return sendFile(c, path.join(publicDir, 'index.html'))
    }
    return served
  }
}