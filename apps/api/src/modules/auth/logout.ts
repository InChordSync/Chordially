import crypto from "node:crypto";
import { revokeRefreshToken } from "./refresh.js";

type Session = {
  userId: string;
  refreshToken: string;
  createdAt: number;
};

type RevokeResult = { ok: true; revoked: number } | { ok: false; reason: "session_not_found" };

const sessions = new Map<string, Session>();

export function registerSession(userId: string, refreshToken: string): string {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { userId, refreshToken, createdAt: Date.now() });
  return sessionId;
}

export function logout(sessionId: string): RevokeResult {
  const session = sessions.get(sessionId);

  if (!session) {
    return { ok: false, reason: "session_not_found" };
  }

  revokeRefreshToken(session.refreshToken);
  sessions.delete(sessionId);

  console.info("[logout] session revoked", { sessionId, userId: session.userId });

  return { ok: true, revoked: 1 };
}

export function logoutAll(userId: string): RevokeResult {
  const toRevoke = [...sessions.entries()].filter(([, s]) => s.userId === userId);

  if (toRevoke.length === 0) {
    return { ok: false, reason: "session_not_found" };
  }

  for (const [sessionId, session] of toRevoke) {
    revokeRefreshToken(session.refreshToken);
    sessions.delete(sessionId);
  }

  console.info("[logout] all sessions revoked", { userId, count: toRevoke.length });

  return { ok: true, revoked: toRevoke.length };
}
