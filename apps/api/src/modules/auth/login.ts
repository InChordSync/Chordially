import crypto from "node:crypto";
import { signToken } from "./auth.tokens.js";

type Credential = {
  passwordHash: string;
  salt: string;
  userId: string;
};

type LoginResult =
  | { ok: true; token: string; sessionId: string }
  | { ok: false; reason: "invalid_credentials" };

// In-memory credential store keyed by email
const credentials = new Map<string, Credential>();

function verifyPassword(password: string, salt: string, hash: string): boolean {
  const attempt = crypto.pbkdf2Sync(password, salt, 100_000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(attempt), Buffer.from(hash));
}

export function storeCredential(email: string, userId: string, password: string): void {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.pbkdf2Sync(password, salt, 100_000, 32, "sha256").toString("hex");
  credentials.set(email.toLowerCase(), { passwordHash, salt, userId });
}

export function login(email: string, password: string): LoginResult {
  const cred = credentials.get(email.toLowerCase());

  if (!cred) {
    // constant-time dummy check to prevent enumeration
    crypto.timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32));
    return { ok: false, reason: "invalid_credentials" };
  }

  if (!verifyPassword(password, cred.salt, cred.passwordHash)) {
    return { ok: false, reason: "invalid_credentials" };
  }

  const sessionId = crypto.randomUUID();
  const token = signToken(cred.userId);

  console.info("[login] session issued", { userId: cred.userId, sessionId });

  return { ok: true, token, sessionId };
}
