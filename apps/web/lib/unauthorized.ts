export type UnauthorizedReason = "signed-out" | "expired" | "forbidden" | "unknown";

export function mapAuthErrorToUnauthorizedReason(error: unknown): UnauthorizedReason {
  if (typeof error !== "string") return "unknown";
  if (error === "FORBIDDEN") return "forbidden";
  if (error === "TOKEN_EXPIRED") return "expired";
  if (error === "TOKEN_INVALID" || error === "INVALID_SESSION") return "signed-out";
  return "unknown";
}

type UnauthorizedUrlOptions = {
  reason: UnauthorizedReason;
  next?: string;
};

export function createUnauthorizedUrl({ reason, next }: UnauthorizedUrlOptions): string {
  const params = new URLSearchParams();
  if (reason !== "unknown") params.set("reason", reason);
  if (next) params.set("next", next);
  const query = params.toString();
  return query ? `/unauthorized?${query}` : "/unauthorized";
}

export function parseUnauthorizedReason(value: unknown): UnauthorizedReason {
  if (typeof value !== "string") return "unknown";
  if (value === "signed-out" || value === "expired" || value === "forbidden") return value;
  return "unknown";
}
