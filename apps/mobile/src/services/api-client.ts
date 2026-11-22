const ENV_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

if (!__DEV__ && !ENV_API_BASE_URL) {
  throw new Error("EXPO_PUBLIC_API_URL must be set for release builds")
}

export const API_BASE_URL = ENV_API_BASE_URL ?? "http://localhost:4000"

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
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
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
        : "Something went wrong"

    throw new ApiError(response.status, message)
  }

  return data as T
}
