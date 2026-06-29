import { createContext, useContext, useState, type ReactNode } from 'react'
import type { AuthUser, AuthResponse } from '@chordially/shared'

interface AuthTestContextValue {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthTestContext = createContext<AuthTestContextValue>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
})

export function useAuthTest() {
  return useContext(AuthTestContext)
}

export function AuthTestProvider({ children, initialUser }: { children: ReactNode; initialUser?: AuthUser }) {
  const [user, setUser] = useState<AuthUser | null>(initialUser || null)
  const [token] = useState<string | null>('test-token')

  const login = async (_email: string, _password: string) => {
    setUser({ id: 'test-user', email: 'test@test.com', displayName: 'Test' })
  }

  const logout = () => setUser(null)

  return (
    <AuthTestContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthTestContext.Provider>
  )
}
