const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.chordially.local"

const TOKEN_STORAGE_KEY = "chordially.token"
const REFRESH_TOKEN_STORAGE_KEY = "chordially.refreshToken"
const USER_STORAGE_KEY = "chordially.user"
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"]

export const UNAUTHORIZED_EVENT = "chordially:auth:unauthorized"

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
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

// handleUnauthorized and clearStoredAuth defined above.

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  if (!refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ refreshToken }),
        })

        const data: any = await response.json().catch(() => null)
        if (!response.ok) return null

        const nextToken = data?.accessToken ?? data?.token
        const nextRefreshToken = data?.refreshToken
        if (typeof nextToken !== "string" || typeof nextRefreshToken !== "string") return null

        window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
        window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, nextRefreshToken)
        if (data?.user) {
          window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user))
        }
        return nextToken
      } catch {
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  _retried = false
): Promise<T> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null
  const headers = new Headers(options.headers ?? {})
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  if (!headers.has("X-Requested-With")) headers.set("X-Requested-With", "XMLHttpRequest")
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  })

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && !_retried) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return apiFetch<T>(path, options, true)
      }
      handleUnauthorized()
    } else if (response.status === 401) {
      handleUnauthorized()
    }

    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      (data as any).error &&
      typeof (data as any).error === "object" &&
      "message" in (data as any).error &&
      typeof (data as any).error.message === "string"
        ? (data as any).error.message
        : "Something went wrong"

    throw new ApiError(response.status, message)
  }

  return data as T
}

export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}
