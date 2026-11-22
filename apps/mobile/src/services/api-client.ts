const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000"

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export class NetworkError extends Error {
  constructor(message = "Network request failed") {
    super(message)
    this.name = "NetworkError"
  }
}

let authTokenGetter: (() => string | null | Promise<string | null>) | null = null
let onUnauthorized: (() => void | Promise<void>) | null = null

export function setAuthTokenGetter(getter: (() => string | null | Promise<string | null>) | null) {
  authTokenGetter = getter
}

export function setOnUnauthorized(handler: (() => void | Promise<void>) | null) {
  onUnauthorized = handler
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = (await authTokenGetter?.()) ?? null
  const headers = new Headers(options.headers ?? {})
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed"
    throw new NetworkError(message)
  }

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      await onUnauthorized?.()
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
