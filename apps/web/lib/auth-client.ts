// NOTE: CSRF protection is verified for the header-token auth pattern since custom headers (e.g. Authorization) require pre-flight checks and cannot be sent by standard cross-site form submissions.
// The httpOnly "chordially.token" cookie (SameSite=Strict) is also sent on authenticated requests via credentials: "include"; the custom "X-Requested-With" header forces a CORS preflight, and the SameSite=Strict cookie is never attached to cross-site requests, so cookie-authenticated endpoints stay CSRF-safe.
import type { AuthResponse, LoginInput, RegisterInput } from "@chordially/shared"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export class AuthApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthApiError"
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify(body),
  })

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      data.error &&
      typeof data.error === "object" &&
      "message" in data.error &&
      typeof data.error.message === "string"
        ? data.error.message
        : "Something went wrong. Please try again."

    throw new AuthApiError(message)
  }

  return data as T
}

export function registerUser(input: RegisterInput): Promise<AuthResponse> {
  return postJson<AuthResponse>("/api/auth/register", input)
}

export function loginUser(input: LoginInput): Promise<AuthResponse> {
  return postJson<AuthResponse>("/api/auth/login", input)
}
