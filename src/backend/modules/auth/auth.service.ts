import { SignJWT, jwtVerify } from 'jose'

export interface AuthService {
  createToken(masterKey: string): Promise<{ token: string; expiresAt: string } | null>
  verifyToken(token: string): Promise<boolean>
}

export function createAuthService(
  masterKey: string,
  jwtSecret: string,
  expiresInSeconds: number,
): AuthService {
  const encodedSecret = new TextEncoder().encode(jwtSecret)

  async function createToken(inputKey: string) {
    if (inputKey !== masterKey) return null
    const issuedAt = Math.floor(Date.now() / 1000)
    const expiresAtSeconds = issuedAt + expiresInSeconds
    const token = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAtSeconds)
      .sign(encodedSecret)
    return { token, expiresAt: new Date(expiresAtSeconds * 1000).toISOString() }
  }

  async function verifyToken(token: string): Promise<boolean> {
    try {
      const { payload } = await jwtVerify(token, encodedSecret)
      if (typeof payload.exp !== 'number') return false
      return payload.exp * 1000 > Date.now()
    } catch {
      return false
    }
  }

  return { createToken, verifyToken }
}