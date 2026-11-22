import { NativeModules, Platform } from "react-native"

function resolveDefaultApiBaseUrl(): string {
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL
  if (scriptURL) {
    try {
      const host = new URL(scriptURL).hostname
      if (host) {
        return `http://${host}:4000`
      }
    } catch {
      // Fall back to platform defaults below.
    }
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000"
  }

  return "http://localhost:4000"
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? resolveDefaultApiBaseUrl()

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
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new ApiError(
      0,
      `Cannot reach API at ${API_BASE_URL}. Check EXPO_PUBLIC_API_URL and device/emulator networking. (${reason})`
    )
  }

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
