import type { AuthErrorCode } from "@chordially/types";

export type AccountRestriction = "disabled" | "banned" | "unknown";

export function restrictionFromAuthError(error: AuthErrorCode | string | undefined): AccountRestriction {
  if (error === "ACCOUNT_DISABLED") return "disabled";
  if (error === "ACCOUNT_BANNED") return "banned";
  return "unknown";
}

export function parseRestriction(value: unknown): AccountRestriction {
  if (value === "disabled" || value === "banned") return value;
  return "unknown";
}

