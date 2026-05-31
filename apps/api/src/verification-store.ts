/**
 * verification-store.ts
 *
 * Provider-agnostic email verification flow.
 * Plug a real mailer adapter into `sendVerificationEmail` when ready.
 */
import { randomBytes } from "node:crypto";

type VerificationToken = {
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
};

const tokens = new Map<string, VerificationToken>();
const verifiedEmails = new Set<string>();

const TTL_MS = 24 * 60 * 60 * 1000; // 24 h

export function resetVerificationStore(): void {
  tokens.clear();
  verifiedEmails.clear();
}

/**
 * Issues a verification token for the given user/email pair.
 * Replace the console.log stub with a real mailer adapter.
 */
export function requestVerification(userId: string, email: string): string {
  const token = randomBytes(32).toString("hex");
  tokens.set(token, {
    userId,
    email,
    token,
    expiresAt: new Date(Date.now() + TTL_MS).toISOString(),
  });
  // TODO: inject mailer adapter here — sendVerificationEmail(email, token)
  console.log(`[verification] token for ${email}: ${token}`);
  return token;
}

export function confirmVerification(token: string): { userId: string; email: string } {
  const record = tokens.get(token);
  if (!record)                                    throw Object.assign(new Error("Token not found."),       { code: "TOKEN_INVALID" });
  if (record.usedAt)                              throw Object.assign(new Error("Token already used."),    { code: "TOKEN_INVALID" });
  if (new Date(record.expiresAt) < new Date())    throw Object.assign(new Error("Token expired."),         { code: "TOKEN_EXPIRED" });

  record.usedAt = new Date().toISOString();
  verifiedEmails.add(record.email);
  return { userId: record.userId, email: record.email };
}

export function isEmailVerified(email: string): boolean {
  return verifiedEmails.has(email.trim().toLowerCase());
}
