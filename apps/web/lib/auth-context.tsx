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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    const storedUser = window.localStorage.getItem(USER_STORAGE_KEY)

    if (storedToken && storedUser) {
      setToken(storedToken)
      try {
        setUser(JSON.parse(storedUser) as AuthUser)
      } catch {
        // Corrupted or manually-edited localStorage data — clear and recover
        window.localStorage.removeItem(TOKEN_STORAGE_KEY)
        window.localStorage.removeItem(USER_STORAGE_KEY)
      }
    }

    setIsLoading(false)
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
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(USER_STORAGE_KEY)
    setUser(null)
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout }}
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
