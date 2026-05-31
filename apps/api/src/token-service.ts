/**
 * token-service.ts
 *
 * Thin wrapper around jsonwebtoken for signing and verifying access tokens.
 * Keep this module free of route or store logic so it can be tested in isolation
 * and swapped out without touching the rest of the auth layer.
 */
import jwt from "jsonwebtoken";

import { env } from "./env.js";

export type AccessTokenPayload = {
  sub: string;   // userId
  sid: string;   // sessionToken
};

/**
 * Signs a short-lived JWT access token for the given user and session.
 */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_TTL_SECONDS });
}

/**
 * Verifies a JWT access token and returns its payload.
 * Throws if the token is expired, tampered, or otherwise invalid.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}
