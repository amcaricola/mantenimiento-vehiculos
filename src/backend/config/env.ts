import { z } from 'zod'

function parseDurationToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim())
  if (!match) {
    throw new Error(`Duración inválida para JWT_EXPIRES_IN: "${value}"`)
  }
  const amount = Number(match[1])
  const unit = match[2]
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 }
  return amount * multipliers[unit]
}

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  MASTER_KEY: z.string().min(1).default('secret-master-key'),
  JWT_SECRET: z.string().min(1).default('dev-only-jwt-secret'),
  JWT_EXPIRES_IN: z.string().min(1).default('24h'),
  DATA_DIR: z.string().default('./data'),
  UPLOADS_DIR: z.string().default('./uploads'),
  PUBLIC_DIR: z.string().default('./dist'),
})

export type Env = z.infer<typeof envSchema>

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source)
  if (!parsed.success) {
    const details = JSON.stringify(parsed.error.flatten().fieldErrors)
    throw new Error(`Configuración de entorno inválida: ${details}`)
  }
  return {
    ...parsed.data,
    JWT_EXPIRES_IN: parsed.data.JWT_EXPIRES_IN,
  }
}

export function getJwtExpirationSeconds(expiresIn: string): number {
  return parseDurationToSeconds(expiresIn)
}