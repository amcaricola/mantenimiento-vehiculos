import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { ApiError } from '../../middleware/error.middleware'

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

export class UploadService {
  constructor(private readonly dir: string) {}

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true })
  }

  private validate(file: File): void {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new ApiError(400, `Tipo de archivo no permitido: ${file.type || 'desconocido'}`)
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new ApiError(400, 'El archivo supera el tamaño máximo de 8 MB')
    }
  }

  async save(file: File): Promise<string> {
    this.validate(file)
    await this.ensureDir()
    const ext = path.extname(file.name).toLowerCase() || '.jpg'
    const filename = `${crypto.randomUUID()}${ext}`
    const bytes = new Uint8Array(await file.arrayBuffer())
    await fs.writeFile(path.join(this.dir, filename), bytes)
    return `/uploads/${filename}`
  }

  async removeByUrl(url: string): Promise<void> {
    if (!url.startsWith('/uploads/')) return
    const filename = path.basename(url)
    const target = path.resolve(this.dir, filename)
    const root = path.resolve(this.dir)
    if (!target.startsWith(root + path.sep)) return
    try {
      await fs.unlink(target)
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code
      if (code !== 'ENOENT') throw err
    }
  }
}