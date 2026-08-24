import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createApp } from '../src/backend/app'
import type { Env } from '../src/backend/config/env'

export const TEST_MASTER_KEY = 'test-master-key'

export interface TestApp {
  app: Awaited<ReturnType<typeof createApp>>['app']
  env: Env
  tmpDir: string
}

export async function createTestApp(): Promise<TestApp> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mveh-test-'))
  const env: Env = {
    PORT: 0,
    MASTER_KEY: TEST_MASTER_KEY,
    JWT_SECRET: 'test-jwt-secret-key',
    JWT_EXPIRES_IN: '24h',
    DATA_DIR: path.join(tmpDir, 'data'),
    UPLOADS_DIR: path.join(tmpDir, 'uploads'),
    PUBLIC_DIR: path.join(tmpDir, 'dist'),
  }
  const { app } = await createApp(env)
  return { app, env, tmpDir }
}

export async function login(app: TestApp['app'], key = TEST_MASTER_KEY): Promise<string> {
  const res = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ masterKey: key }),
  })
  const body = (await res.json()) as { token: string }
  return body.token
}

export function bearer(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}