import type { AuthSession, AuthUser } from "./index.js";

// ── Request shapes ────────────────────────────────────────────────────────────

export type RegisterRequest = {
  email: string;
  password: string;
  displayName: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LogoutRequest = {
  token: string;
};

// ── Response envelopes ────────────────────────────────────────────────────────

export type RegisterResponse = {
  message: string;
  user: AuthUser;
};

export type LoginResponse = {
  message: string;
  session: AuthSession;
};

export type LogoutResponse = {
  message: string;
};

export type SessionResponse = {
  session: AuthSession | null;
};

export type IntrospectResponse = {
  user: AuthUser;
  session: Omit<AuthSession, "revokedAt">;
};

export type RefreshResponse = {
  session: AuthSession;
  refreshToken: string;
};

// ── Error envelope ────────────────────────────────────────────────────────────

export type AuthErrorCode =
  | "DUPLICATE_EMAIL"
  | "INVALID_CREDENTIALS"
  | "INVALID_SESSION"
  | "POLICY_VIOLATION"
  | "MALFORMED_REQUEST"
  | "FORBIDDEN"
  | "ACCOUNT_DISABLED"
  | "ACCOUNT_BANNED"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID";

export type AuthErrorResponse = {
  error: AuthErrorCode;
  message: string;
};
