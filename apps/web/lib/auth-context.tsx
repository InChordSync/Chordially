"use client"

import type { AuthUser, LoginInput, RegisterInput } from "@chordially/shared"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { loginUser, registerUser } from "./auth-client"
import { getMe } from "./user-client"

const TOKEN_STORAGE_KEY = "chordially.token"
const USER_STORAGE_KEY = "chordially.user"

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
    const payload = JSON.parse(atob(padded)) as { exp?: unknown }
    return typeof payload.exp === "number" ? payload.exp : null
  } catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  const exp = decodeJwtExp(token)
  if (exp === null) return false
  return exp * 1000 <= Date.now()
}

function clearStoredAuth() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(USER_STORAGE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY)
      const storedUser = window.localStorage.getItem(USER_STORAGE_KEY)

      if (!storedToken || !storedUser) {
        if (!cancelled) setIsLoading(false)
        return
      }

      if (isTokenExpired(storedToken)) {
        clearStoredAuth()
        if (!cancelled) setIsLoading(false)
        return
      }

      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser
        const me = await getMe(storedToken)
        if (cancelled) return
        setToken(storedToken)
        setUser(me.user ?? parsedUser)
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(me.user ?? parsedUser))
      } catch {
        clearStoredAuth()
        if (!cancelled) {
          setUser(null)
          setToken(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== TOKEN_STORAGE_KEY && event.key !== USER_STORAGE_KEY) return
      const nextToken = window.localStorage.getItem(TOKEN_STORAGE_KEY)
      const nextUserRaw = window.localStorage.getItem(USER_STORAGE_KEY)

      if (!nextToken || !nextUserRaw) {
        setUser(null)
        setToken(null)
        return
      }

      try {
        setUser(JSON.parse(nextUserRaw) as AuthUser)
        setToken(nextToken)
      } catch {
        setUser(null)
        setToken(null)
      }
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const persist = useCallback((nextUser: AuthUser, nextToken: string) => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    setToken(nextToken)
  }, [])

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await loginUser(input)
      persist(result.user, result.token)
    },
    [persist]
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await registerUser(input)
      persist(result.user, result.token)
    },
    [persist]
  )

  const logout = useCallback(() => {
    clearStoredAuth()
    setUser(null)
    setToken(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, login, register, logout }),
    [user, token, isLoading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
