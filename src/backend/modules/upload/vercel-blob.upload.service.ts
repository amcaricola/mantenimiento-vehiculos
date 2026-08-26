import crypto from 'node:crypto'
import path from 'node:path'
import { put, del } from '@vercel/blob'
import { ApiError } from '../../middleware/error.middleware.js'
import type { UploadServiceContract } from './upload.service.js'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/bmp',
]

const MAX_FILE_BYTES = 8 * 1024 * 1024

export class VercelBlobUploadService implements UploadServiceContract {
  async save(file: File): Promise<string> {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new ApiError(
        400,
        `Tipo de archivo no permitido: ${file.type || 'desconocido'}`,
      )
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new ApiError(400, 'El archivo supera el tamaño máximo de 8 MB')
    }
    const ext = path.extname(file.name).toLowerCase() || '.jpg'
    const filename = `${crypto.randomUUID()}${ext}`
    const bytes = await file.arrayBuffer()
    const result = await put(`uploads/${filename}`, bytes, {
      access: 'public',
      contentType: file.type,
    })
    return result.url
  }

  async removeByUrl(url: string): Promise<void> {
    try {
      await del(url)
    } catch {
      // El archivo puede no existir; se ignora
    }
  }
}