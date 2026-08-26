import { ApiError } from '../../middleware/error.middleware.js'

const IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif|heic|heif|bmp|avif)$/i
const MAX_FILE_BYTES = 8 * 1024 * 1024

export function isFileLike(value: unknown): value is File {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as File).arrayBuffer === 'function' &&
    typeof (value as File).size === 'number' &&
    typeof (value as File).name === 'string'
  )
}

export function validateImageFile(file: File): void {
  const hasImageMime = file.type.startsWith('image/')
  const isGenericMime = file.type === '' || file.type === 'application/octet-stream'
  const extensionOk = IMAGE_EXTENSION.test(file.name)

  if (!hasImageMime && !(isGenericMime && extensionOk)) {
    throw new ApiError(400, `Tipo de archivo no permitido: ${file.type || 'desconocido'}`)
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ApiError(400, 'El archivo supera el tamaño máximo de 8 MB')
  }
}