export type UserRole = "builder" | "artist" | "fan" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  /**
   * Starter-friendly account restriction flag.
   * - "active": normal access
   * - "disabled": temporarily blocked (e.g. moderation or safety)
   * - "banned": permanently blocked
   */
  accountStatus?: "active" | "disabled" | "banned";
};

export type AuthSession = {
  token: string;
  userId: string;
  createdAt: string;
  /** ISO timestamp of the most recent activity on this session. */
  lastSeenAt: string;
  /** ISO timestamp when the session was revoked; undefined if still active. */
  revokedAt?: string;
  /** Hint about where the session originated, e.g. "web" or "mobile". */
  origin?: string;
  /** Client IP address captured at session creation (redacted in logs). */
  ip?: string;
  /** User-agent string captured at session creation (redacted in logs). */
  userAgent?: string;
};

export type RefreshToken = {
  token: string;
  sessionToken: string;
  userId: string;
  createdAt: string;
  /** ISO timestamp after which this refresh token is no longer valid. */
  expiresAt: string;
  /** ISO timestamp when this token was consumed by a rotation; undefined if unused. */
  usedAt?: string;
};

export type Milestone = {
  key: string;
  title: string;
  goal: string;
};

export type { AuthErrorCode } from "./auth-contracts.js";
