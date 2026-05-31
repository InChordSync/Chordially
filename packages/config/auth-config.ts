export type AuthErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_EMAIL_UNVERIFIED"
  | "AUTH_SESSION_EXPIRED"
  | "AUTH_RATE_LIMITED"
  | "AUTH_CHALLENGE_REQUIRED";

export const authDefaults = {
  accessTokenTtlSeconds: 900,
  refreshTokenTtlSeconds: 604800,
  lockoutWindowSeconds: 900,
  lockoutMaxAttempts: 5,
} as const;

export function normalizeAuthError(code: AuthErrorCode): {
  code: AuthErrorCode;
  message: string;
} {
  const messages: Record<AuthErrorCode, string> = {
    AUTH_INVALID_CREDENTIALS: "Invalid credentials.",
    AUTH_EMAIL_UNVERIFIED: "Email verification required.",
    AUTH_SESSION_EXPIRED: "Session expired. Please sign in again.",
    AUTH_RATE_LIMITED: "Too many attempts. Try again later.",
    AUTH_CHALLENGE_REQUIRED: "Additional auth challenge required.",
  };

  return { code, message: messages[code] };
}
