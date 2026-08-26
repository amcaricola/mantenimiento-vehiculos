import { Hono } from 'hono'
import type { AppContext } from './backend/app.types.js'
import { createApp } from './backend/app.js'
import { loadEnv } from './backend/config/env.js'

const app: Hono<AppContext> = createApp(loadEnv()).app

export default app