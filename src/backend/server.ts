import { serve } from '@hono/node-server'
import { createApp } from './app'
import { loadEnv } from './config/env'

async function main() {
  const env = loadEnv()
  const { app } = await createApp(env)

  serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    (info) => {
      console.log(`[mantenimiento-vehiculos] Servidor listo en http://localhost:${info.port}`)
    },
  )
}

main().catch((err) => {
  console.error('[mantenimiento-vehiculos] Error al iniciar el servidor:', err)
  process.exit(1)
})