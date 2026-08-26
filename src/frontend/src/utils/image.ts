const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.85
const COMPRESS_THRESHOLD = 400 * 1024

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo decodificar la imagen'))
    }
    img.src = url
  })
}

export async function compressImage(file: File): Promise<File> {
  const img = await loadImageElement(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')
  ctx.drawImage(img, 0, 0, w, h)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  )
  if (!blob) throw new Error('No se pudo comprimir la imagen')

  const base = file.name.replace(/\.[^.]+$/, '') || 'imagen'
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
}

export async function processImageFile(file: File): Promise<File> {
  if (file.type.startsWith('image/') && file.size > COMPRESS_THRESHOLD) {
    try {
      const compressed = await compressImage(file)
      if (compressed.size < file.size) return compressed
    } catch {
      // Si no se puede comprimir, se usa el archivo original
    }
  }
  return file
}