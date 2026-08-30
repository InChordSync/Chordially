import type { User } from "../../users/types/user.types.js"

export interface AuthUserResponse {
  id: string
  email: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResult {
  user: AuthUserResponse
  token: string
  refreshToken: string
  emailVerificationToken: string
}

export interface AuthRefreshResult {
  user: AuthUserResponse
  accessToken: string
  refreshToken: string
}

export function toAuthUserResponse(user: User): AuthUserResponse {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}
