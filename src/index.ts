import { Hono } from 'hono'
import type { AppContext } from './backend/app.types'
import { createApp } from './backend/app'
import { loadEnv } from './backend/config/env'

const app: Hono<AppContext> = createApp(loadEnv()).app

export default app