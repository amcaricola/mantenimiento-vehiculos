import { Hono } from 'hono'
import type { AppContext } from './backend/app.types.js'
import { createApp } from './backend/app.js'
import { loadEnv } from './backend/config/env.js'
import { vercelHtml } from './vercel-html.generated.js'

const app: Hono<AppContext> = createApp(loadEnv()).app

// En Vercel los estáticos del SPA se sirven desde la propia función (la app se
// compila como un único HTML autocontenido). Cualquier ruta no-API responde con
// la aplicación.
app.notFound((c) => c.html(vercelHtml))

export default app