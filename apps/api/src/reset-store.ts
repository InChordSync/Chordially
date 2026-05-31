/**
 * reset-store.ts
 *
 * Password reset request and completion flow.
 * Tokens are one-time use and expire after 1 hour.
 */
import { randomBytes } from "node:crypto";

type ResetToken = {
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
};

const tokens = new Map<string, ResetToken>();

const TTL_MS = 60 * 60 * 1000; // 1 h

export function resetPasswordResetStore(): void {
  tokens.clear();
}

/**
 * Mints a reset token for the given user.
 * Replace the console.log stub with a real mailer adapter.
 */
export function requestPasswordReset(userId: string, email: string): string {
  const token = randomBytes(32).toString("hex");
  tokens.set(token, {
    userId,
    email,
    token,
    expiresAt: new Date(Date.now() + TTL_MS).toISOString(),
  });
  // TODO: inject mailer adapter here — sendPasswordResetEmail(email, token)
  console.log(`[reset] token for ${email}: ${token}`);
  return token;
}

/**
 * Validates a reset token and returns the associated userId.
 * Marks the token as used so it cannot be replayed.
 */
export function consumeResetToken(token: string): { userId: string; email: string } {
  const record = tokens.get(token);
  if (!record)                                    throw Object.assign(new Error("Token not found."),    { code: "TOKEN_INVALID" });
  if (record.usedAt)                              throw Object.assign(new Error("Token already used."), { code: "TOKEN_INVALID" });
  if (new Date(record.expiresAt) < new Date())    throw Object.assign(new Error("Token expired."),      { code: "TOKEN_EXPIRED" });

  record.usedAt = new Date().toISOString();
  return { userId: record.userId, email: record.email };
}
