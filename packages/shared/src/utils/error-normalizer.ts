export interface NormalizedError {
  code: string;
  message: string;
  source: "api" | "stellar" | "unknown";
  originalMessage?: string;
}

export function normalizeError(
  error: unknown,
  source: NormalizedError["source"] = "unknown"
): NormalizedError {
  if (error instanceof Error) {
    return {
      code: (error as Error & { code?: string }).code ?? "UNKNOWN_ERROR",
      message: "An unexpected error occurred.",
      source,
      originalMessage: error.message,
    };
  }
  if (typeof error === "string") {
    return { code: "STRING_ERROR", message: "An unexpected error occurred.", source, originalMessage: error };
  }
  return { code: "UNKNOWN_ERROR", message: "An unexpected error occurred.", source };
}

export function isStellarError(error: NormalizedError): boolean {
  return error.source === "stellar";
}
