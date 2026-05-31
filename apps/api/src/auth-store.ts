import { randomBytes } from "node:crypto";

import type { AuthErrorCode, AuthSession, AuthUser, RefreshToken } from "@chordially/types";

import { env } from "./env.js";
import { signAccessToken } from "./token-service.js";
import { lockoutRemaining, recordFailure, recordSuccess } from "./lockout-store.js";

/**
 * Typed service-layer error. Carries an AuthErrorCode so the centralized
 * error handler can map it to the correct HTTP status without inspecting
 * message strings. Extend the taxonomy in AuthErrorCode as new auth
 * behaviours are added.
 */
export class AuthServiceError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

type RegisterInput = { email: string; password: string; displayName: string };
type LoginInput    = { email: string; password: string; origin?: string; ip?: string; userAgent?: string };

function parseEmailList(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

const disabledAccounts = parseEmailList(env.DISABLED_ACCOUNTS);
const bannedAccounts = parseEmailList(env.BANNED_ACCOUNTS);

const users    = new Map<string, AuthUser & { password: string }>();
const sessions = new Map<string, AuthSession>();
const refreshTokens = new Map<string, RefreshToken>();

export function resetAuthStore(): void {
  users.clear();
  sessions.clear();
  refreshTokens.clear();
}

export function listUsers(): AuthUser[] {
  return [...users.values()].map(({ password: _, ...u }) => u);
}

export function registerUser(input: RegisterInput): AuthUser {
  const email = input.email.trim().toLowerCase();
  if (users.has(email)) throw new AuthServiceError("DUPLICATE_EMAIL", "A user with that email already exists.");

  const user: AuthUser & { password: string } = {
    id: `user_${users.size + 1}`,
    email,
    displayName: input.displayName.trim(),
    role: "builder",
    accountStatus: "active",
    password: input.password,
  };
  users.set(email, user);
  const { password: _, ...safe } = user;
  return safe;
}

export function loginUser(input: LoginInput): { session: AuthSession; refreshToken: string } {
  const email = input.email.trim().toLowerCase();
  const user  = users.get(email);
  if (!user || user.password !== input.password) throw new AuthServiceError("INVALID_CREDENTIALS", "Invalid email or password.");

  if (bannedAccounts.has(email) || user.accountStatus === "banned") {
    throw new AuthServiceError("ACCOUNT_BANNED", "This account is banned.");
  }

  if (disabledAccounts.has(email) || user.accountStatus === "disabled") {
    throw new AuthServiceError("ACCOUNT_DISABLED", "This account is disabled.");
  }

  const now = new Date().toISOString();

  // Build session record; token is a signed JWT.
  const session: AuthSession = {
    token:       signAccessToken({ sub: user.id, sid: `sess_${sessions.size + 1}` }),
    userId:      user.id,
    createdAt:   now,
    lastSeenAt:  now,
    origin:      input.origin,
    ip:          input.ip,
    userAgent:   input.userAgent,
  };
  sessions.set(session.token, session);

  const rt = issueRefreshToken(session.token, user.id);
  return { session, refreshToken: rt.token };
}

/** Revokes a single session by token. Leaves all other sessions intact. */
export function logoutUser(token: string): boolean {
  const session = sessions.get(token);
  if (!session) return false;
  session.revokedAt = new Date().toISOString();
  return true;
}

/** Revokes every active session belonging to a user. Returns the count revoked. */
export function logoutAllSessions(userId: string): number {
  const now = new Date().toISOString();
  let count = 0;
  for (const session of sessions.values()) {
    if (session.userId === userId && !session.revokedAt) {
      session.revokedAt = now;
      count++;
    }
  }
  return count;
}

/** Returns the session only if it exists and has not been revoked. */
export function getActiveSession(token: string): AuthSession | undefined {
  const session = sessions.get(token);
  if (!session || session.revokedAt) return undefined;
  // Touch lastSeenAt on every lookup.
  session.lastSeenAt = new Date().toISOString();
  return session;
}

export function getUserById(id: string): AuthUser | undefined {
  const entry = [...users.values()].find((u) => u.id === id);
  if (!entry) return undefined;
  const { password: _, ...safe } = entry;
  return safe;
}

export function updateUserPassword(userId: string, newPassword: string): void {
  const entry = [...users.values()].find((u) => u.id === userId);
  if (!entry) throw new AuthServiceError("INVALID_SESSION", "User not found.");
  entry.password = newPassword;
}

// ── Refresh token helpers ─────────────────────────────────────────────────────

function issueRefreshToken(sessionToken: string, userId: string): RefreshToken {
  const expiresAt = new Date(Date.now() + env.REFRESH_TTL_SECONDS * 1000).toISOString();
  const rt: RefreshToken = {
    token:        randomBytes(32).toString("hex"),
    sessionToken,
    userId,
    createdAt:    new Date().toISOString(),
    expiresAt,
  };
  refreshTokens.set(rt.token, rt);
  return rt;
}

/**
 * Rotates a refresh token: invalidates the old one and issues a new access
 * token + refresh token pair. Replays of already-used tokens are rejected.
 */
export function rotateRefreshToken(
  oldToken: string,
): { session: AuthSession; refreshToken: string } {
  const rt = refreshTokens.get(oldToken);

  if (!rt)                                    throw new AuthServiceError("TOKEN_INVALID", "Refresh token not found.");
  if (rt.usedAt)                              throw new AuthServiceError("TOKEN_INVALID", "Refresh token already used.");
  if (new Date(rt.expiresAt) < new Date())    throw new AuthServiceError("TOKEN_EXPIRED", "Refresh token expired.");

  // Mark old token as consumed.
  rt.usedAt = new Date().toISOString();

  // Revoke the old session.
  const oldSession = sessions.get(rt.sessionToken);
  if (oldSession) oldSession.revokedAt = rt.usedAt;

  // Find the user.
  const user = [...users.values()].find((u) => u.id === rt.userId);
  if (!user) throw new AuthServiceError("INVALID_SESSION", "User not found.");

  const now = new Date().toISOString();
  const newSession: AuthSession = {
    token:      signAccessToken({ sub: user.id, sid: `sess_${sessions.size + 1}` }),
    userId:     user.id,
    createdAt:  now,
    lastSeenAt: now,
    origin:     oldSession?.origin,
  };
  sessions.set(newSession.token, newSession);

  const newRt = issueRefreshToken(newSession.token, user.id);
  return { session: newSession, refreshToken: newRt.token };
}
