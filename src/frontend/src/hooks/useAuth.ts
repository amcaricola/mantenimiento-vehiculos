import { useCallback, useEffect, useState } from 'preact/hooks'
import { api } from '../services/api.js'

const TOKEN_KEY = 'auth_token'

export function useAuth() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  )
  const [isAdmin, setIsAdmin] = useState(false)
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    let active = true

    async function check() {
      const stored = localStorage.getItem(TOKEN_KEY)
      if (!stored) {
        setIsAdmin(false)
        setVerifying(false)
        return
      }
      try {
        const { valid } = await api.verify(stored)
        if (!active) return
        if (valid) {
          setToken(stored)
          setIsAdmin(true)
        } else {
          localStorage.removeItem(TOKEN_KEY)
          setToken(null)
          setIsAdmin(false)
        }
      } catch {
        if (!active) return
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setIsAdmin(false)
      } finally {
        if (active) setVerifying(false)
      }
    }

    check()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (masterKey: string) => {
    const { token: newToken } = await api.login(masterKey)
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setIsAdmin(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setIsAdmin(false)
  }, [])

  return { token, isAdmin, verifying, login, logout }
}