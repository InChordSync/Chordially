import { NativeModules, Platform } from "react-native"

function resolveDefaultApiBaseUrl(): string {
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL
  if (scriptURL) {
    try {
      const host = new URL(scriptURL).hostname
      if (host) return `http://${host}:4000/api`
    } catch {
      // Fall back to platform defaults below.
    }
  }

  if (Platform.OS === "android") return "http://10.0.2.2:4000/api"
  return "http://localhost:4000/api"
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL
    ? `${process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "")}/api`
    : resolveDefaultApiBaseUrl();
