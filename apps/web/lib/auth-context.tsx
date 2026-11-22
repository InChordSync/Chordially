"use client"

import type { AuthUser, LoginInput, RegisterInput } from "@chordially/shared"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { loginUser, registerUser } from "./auth-client"

const TOKEN_STORAGE_KEY = "chordially.token"
const REFRESH_TOKEN_STORAGE_KEY = "chordially.refreshToken"
const USER_STORAGE_KEY = "chordially.user"

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    const storedRefreshToken = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
    const storedUser = window.localStorage.getItem(USER_STORAGE_KEY)

    if (storedToken && storedUser) {
      setToken(storedToken)
      setRefreshToken(storedRefreshToken)
      try {
        setUser(JSON.parse(storedUser) as AuthUser)
      } catch {
        window.localStorage.removeItem(USER_STORAGE_KEY)
        window.localStorage.removeItem(TOKEN_STORAGE_KEY)
        window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
        setToken(null)
        setRefreshToken(null)
      }
    }

    setIsLoading(false)
  }, [])

  const persist = useCallback((nextUser: AuthUser, nextToken: string, nextRefreshToken: string) => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, nextRefreshToken)
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    setToken(nextToken)
    setRefreshToken(nextRefreshToken)
  }, [])

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await loginUser(input)
      persist(result.user, result.token, result.refreshToken)
    },
    [persist]
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await registerUser(input)
      persist(result.user, result.token, result.refreshToken)
    },
    [persist]
  )

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(USER_STORAGE_KEY)
    setUser(null)
    setToken(null)
    setRefreshToken(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, token, refreshToken, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
