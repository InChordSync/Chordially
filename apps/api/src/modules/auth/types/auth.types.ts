import type { User } from "../../users/types/user.types.js"

export interface AuthUserResponse {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface AuthResult {
  user: AuthUserResponse
  token: string
  refreshToken: string
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
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}
