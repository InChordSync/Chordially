import crypto from "node:crypto"
import jwt from "jsonwebtoken"
import { env } from "../config/env.js"
import { stellarClient } from "../stellar/client.js"

const CHALLENGE_PURPOSE = "wallet-link-challenge"
const CHALLENGE_EXPIRES_IN = "5m"

interface ChallengePayload {
  purpose: typeof CHALLENGE_PURPOSE
  publicKey: string
  nonce: string
}

/**
 * Issues a signed, short-lived challenge for a claimed public key. This
 * needs no server-side storage (the challenge itself, JWT-signed, carries
 * everything needed to verify it later) so it works even before the caller
 * has an account — proving control of an external wallet is the first step
 * of linking one, which can happen pre-registration.
 */
export function issueWalletLinkChallenge(publicKey: string): { challenge: string; nonce: string } {
  const nonce = crypto.randomBytes(24).toString("base64url")
  const payload: ChallengePayload = { purpose: CHALLENGE_PURPOSE, publicKey, nonce }
  const challenge = jwt.sign(payload, env.JWT_SECRET, { expiresIn: CHALLENGE_EXPIRES_IN })
  return { challenge, nonce }
}

/**
 * Verifies that `signatureBase64` is the claimed account's own signature
 * over the nonce embedded in `challenge`, proving the caller controls the
 * external wallet's secret key without the platform ever seeing it.
 * Returns false for any invalid, expired, mismatched, or tampered input —
 * never throws, so callers can turn a failure into one clean error.
 */
export function verifyWalletLinkChallenge(
  challenge: string,
  publicKey: string,
  signatureBase64: string
): boolean {
  let payload: ChallengePayload
  try {
    payload = jwt.verify(challenge, env.JWT_SECRET) as ChallengePayload
  } catch {
    return false
  }

  if (payload.purpose !== CHALLENGE_PURPOSE || payload.publicKey !== publicKey) {
    return false
  }

  return stellarClient.verifySignature(publicKey, payload.nonce, signatureBase64)
}
