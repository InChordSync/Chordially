export interface AuthUser {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: AuthUser
  token: string
  refreshToken: string
}

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
  }
}
