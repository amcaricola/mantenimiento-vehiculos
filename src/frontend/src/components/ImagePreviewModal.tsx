import { useEffect } from 'preact/hooks'

interface Props {
  url: string
  nombre: string
  onClose: () => void
}

export function ImagePreviewModal({ url, nombre, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={`Respaldo: ${nombre}`}
    >
      <div className="flex items-center justify-between p-3 text-white">
        <h2 className="truncate pr-2 text-sm font-semibold">{nombre}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl leading-none hover:bg-white/20"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-3">
        <img
          src={url}
          alt={`Respaldo de ${nombre}`}
          className="max-h-full max-w-full rounded-lg object-contain"
          draggable={false}
        />
      </div>
      <div className="flex justify-center gap-3 p-4">
        <a
          href={url}
          download
          className="btn-primary"
        >
          Descargar
        </a>
        <button type="button" className="btn-outline !text-white !border-white/40 !bg-transparent" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  )
}