import { list } from '@vercel/blob'

function orderDesc(a, b) {
  return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
}

async function main() {
  const { blobs } = await list({ limit: 1000 })
  console.log('TOTAL blobs en el store:', blobs.length)

  const db = blobs.filter((b) => b.pathname.startsWith('db'))
  console.log('Blobs de la base (db.json / db-*):', db.length)
  for (const b of [...db].sort(orderDesc)) {
    console.log(`  ${b.pathname} | size=${b.size}B | uploadedAt=${b.uploadedAt}`)
  }

  const images = blobs.filter((b) => !b.pathname.startsWith('db'))
  console.log('Otros blobs (imágenes u otros):', images.length)

  console.log('--- Contenido de los 5 blobs de base más recientes ---')
  for (const b of [...db].sort(orderDesc).slice(0, 5)) {
    try {
      const res = await fetch(b.url)
      if (!res.ok) {
        console.log(`  ${b.pathname}: HTTP ${res.status}`)
        continue
      }
      const data = await res.json()
      const v = data?.vehiculos ?? []
      console.log(
        `  ${b.pathname}: ${v.length} vehiculo(s) -> ${v.map((x) => x.patente).join(', ') || '(vacío)'}`,
      )
    } catch (e) {
      console.log(`  ${b.pathname}: error al leer -> ${e?.message ?? e}`)
    }
  }
}

main().catch((e) => {
  console.error('ERROR:', e?.message ?? e)
  process.exit(1)
})