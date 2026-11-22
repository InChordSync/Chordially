export function parseAllowedOrigins(raw: string | undefined): string[] {
  return [...new Set((raw ?? "").split(",").map((origin) => origin.trim()).filter(Boolean))]
}

export function assertProductionCorsConfigured(nodeEnv: string, allowedOrigins: string[]): void {
  if (nodeEnv === "production" && allowedOrigins.length === 0) {
    throw new Error("CORS_ALLOWED_ORIGINS must contain at least one origin in production")
  }
}
