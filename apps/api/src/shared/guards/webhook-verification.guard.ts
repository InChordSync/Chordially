import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  type CustomDecorator,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { createHmac, timingSafeEqual } from "node:crypto"
import type { Request } from "express"
import { env } from "../config/env.js"
import { AppError } from "../errors/app-error.js"
import { logger } from "../logger/logger.js"
import { metrics } from "../metrics/metrics.js"

export const WEBHOOK_PROVIDER_KEY = "chordially:webhook-provider"

export function WebhookProvider(provider: string): CustomDecorator<string> {
  return SetMetadata(WEBHOOK_PROVIDER_KEY, provider)
}

const seenNonces = new Map<string, number>()

function pruneNonces(now: number): void {
  for (const [key, expiresAt] of seenNonces) {
    if (expiresAt <= now) seenNonces.delete(key)
  }
}

function reject(provider: string, reason: string, status = 401): never {
  metrics.incrementCounter("webhook.auth.rejected", 1)
  logger.warn("Rejected webhook", { provider, reason })
  throw new AppError(status, "WEBHOOK_REJECTED", "Webhook authentication failed")
}

@Injectable()
export class WebhookVerificationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const provider = this.reflector.getAllAndOverride<string | undefined>(
      WEBHOOK_PROVIDER_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (!provider || (provider !== "deposit" && provider !== "creator-payout")) {
      return reject("unknown", "unsupported provider", 500)
    }

    const secret = provider === "deposit"
      ? env.DEPOSIT_WEBHOOK_SECRET
      : env.CREATOR_PAYOUT_WEBHOOK_SECRET

    if (!secret) return reject(provider, "secret not configured", 503)

    const req = context.switchToHttp().getRequest<Request>()
    const signatureHeader = req.header("x-webhook-signature")
    const timestampHeader = req.header("x-webhook-timestamp")
    const nonce = req.header("x-webhook-nonce")

    if (!signatureHeader || !timestampHeader || !nonce) {
      return reject(provider, "missing signature headers")
    }

    const timestamp = Number(timestampHeader)
    const now = Math.floor(Date.now() / 1000)
    if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > env.WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS) {
      return reject(provider, "stale timestamp")
    }

    const rawBody = (req as any).rawBody as Buffer | undefined
    const payload = rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}))
    const expected = createHmac("sha256", secret)
      .update(`${timestamp}.${nonce}.`)
      .update(payload)
      .digest("hex")
    const supplied = signatureHeader.replace(/^sha256=/, "")
    const expectedBuffer = Buffer.from(expected, "hex")
    const suppliedBuffer = Buffer.from(supplied, "hex")

    if (
      expectedBuffer.length !== suppliedBuffer.length ||
      !timingSafeEqual(expectedBuffer, suppliedBuffer)
    ) {
      return reject(provider, "invalid signature")
    }

    pruneNonces(now)
    const replayKey = `${provider}:${nonce}`
    const expiresAt = seenNonces.get(replayKey)
    if (expiresAt && expiresAt > now) {
      return reject(provider, "replayed nonce", 409)
    }
    seenNonces.set(replayKey, now + env.WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS)

    return true
  }
}
