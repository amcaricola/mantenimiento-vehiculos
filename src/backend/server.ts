import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { loadEnv } from './config/env.js'

function main() {
  const env = loadEnv()
  const { app } = createApp(env)

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

main()