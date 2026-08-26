import crypto from 'node:crypto'
import path from 'node:path'
import { put, del } from '@vercel/blob'
import type { UploadServiceContract } from './upload.service.js'
import { validateImageFile } from './validation.js'

export class VercelBlobUploadService implements UploadServiceContract {
  async save(file: File): Promise<string> {
    validateImageFile(file)
    const ext = path.extname(file.name).toLowerCase() || '.jpg'
    const filename = `${crypto.randomUUID()}${ext}`
    const bytes = await file.arrayBuffer()
    const result = await put(`uploads/${filename}`, bytes, {
      access: 'public',
      contentType: file.type || undefined,
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