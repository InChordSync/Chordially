const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.chordially.local"

const TOKEN_STORAGE_KEY = "chordially.token"
const USER_STORAGE_KEY = "chordially.user"
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"]

export const UNAUTHORIZED_EVENT = "chordially:auth:unauthorized"

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(USER_STORAGE_KEY)
}

export function handleUnauthorized(): void {
  if (typeof window === "undefined") return

  clearStoredAuth()
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))

  const { pathname, search, hash } = window.location
  if (AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return
  }

  const next = `${pathname}${search}${hash}`
  const loginUrl = new URL("/login", window.location.origin)
  if (next && next !== "/login") {
    loginUrl.searchParams.set("next", next)
  }
  window.location.assign(loginUrl.toString())
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...options.headers,
    },
  })

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized()
    }

    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      data.error &&
      typeof data.error === "object" &&
      "message" in data.error &&
      typeof data.error.message === "string"
        ? data.error.message
        : "Something went wrong"

    throw new ApiError(response.status, message)
  }

  return data as T
}

export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}
