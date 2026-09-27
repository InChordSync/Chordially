export interface User {
  id: string
  email: string
  passwordHash: string
  emailVerified: boolean
  failedLoginAttempts: number
  lockedUntil: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserInput {
  email: string
  passwordHash: string
}
