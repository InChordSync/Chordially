import crypto from "node:crypto";
import { signToken } from "./auth.tokens.js";

const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

type RefreshRecord = {
  userId: string;
  expiresAt: number;
  used: boolean;
};

type RotateResult =
  | { ok: true; accessToken: string; refreshToken: string }
  | { ok: false; reason: "invalid" | "expired" | "reuse_detected" };

const store = new Map<string, RefreshRecord>();

export function issueRefreshToken(userId: string): string {
  const token = crypto.randomBytes(40).toString("hex");
  store.set(token, { userId, expiresAt: Date.now() + REFRESH_TTL_MS, used: false });
  return token;
}

export function rotateRefreshToken(token: string): RotateResult {
  const record = store.get(token);

  if (!record) {
    return { ok: false, reason: "invalid" };
  }

  if (record.used) {
    // Reuse detected — revoke entire family by deleting this token
    store.delete(token);
    console.warn("[refresh] reuse detected, token revoked", { userId: record.userId });
    return { ok: false, reason: "reuse_detected" };
  }

  if (record.expiresAt < Date.now()) {
    store.delete(token);
    return { ok: false, reason: "expired" };
  }

  record.used = true;

  const newRefreshToken = issueRefreshToken(record.userId);
  const accessToken = signToken(record.userId);

  console.info("[refresh] token rotated", { userId: record.userId });

  return { ok: true, accessToken, refreshToken: newRefreshToken };
}

export function revokeRefreshToken(token: string): void {
  store.delete(token);
}
