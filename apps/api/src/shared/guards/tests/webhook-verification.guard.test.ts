import 'reflect-metadata'
import { createHmac } from 'node:crypto'
import { Reflector } from '@nestjs/core'
import { beforeEach, describe, expect, it } from 'vitest'
import { env } from '../../config/env.js'
import {
  WEBHOOK_PROVIDER_KEY,
  WebhookVerificationGuard,
} from '../webhook-verification.guard.js'

class DepositWebhookController {}

const handler = () => {}
Reflect.defineMetadata(WEBHOOK_PROVIDER_KEY, 'deposit', handler)

function signedRequest(nonce: string, overrides: Record<string, string> = {}) {
  const body = Buffer.from(JSON.stringify({ event: 'deposit.completed', id: 'dep-1' }))
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = createHmac('sha256', env.DEPOSIT_WEBHOOK_SECRET)
    .update(`${timestamp}.${nonce}.`)
    .update(body)
    .digest('hex')
  const headers: Record<string, string> = {
    'x-webhook-signature': `sha256=${signature}`,
    'x-webhook-timestamp': String(timestamp),
    'x-webhook-nonce': nonce,
    ...overrides,
  }
  const req = {
    body: JSON.parse(body.toString()),
    rawBody: body,
    header: (name: string) => headers[name.toLowerCase()],
  }
  return { req, body, signature, timestamp }
}

function contextFor(req: unknown) {
  return {
    getHandler: () => handler,
    getClass: () => DepositWebhookController,
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => ({}) }),
  } as any
}

describe('WebhookVerificationGuard', () => {
  let guard: WebhookVerificationGuard

  beforeEach(() => {
    guard = new WebhookVerificationGuard(new Reflector())
  })

  it('accepts a correctly signed, fresh, first-seen webhook', () => {
    const { req } = signedRequest(`nonce-happy-${Date.now()}`)
    expect(guard.canActivate(contextFor(req))).toBe(true)
  })

  it('rejects a tampered payload', () => {
    const { req } = signedRequest(`nonce-tamper-${Date.now()}`)
    req.rawBody = Buffer.from(JSON.stringify({ ...req.body, id: 'dep-2' }))

    expect(() => guard.canActivate(contextFor(req))).toThrow(
      expect.objectContaining({ statusCode: 401, code: 'WEBHOOK_REJECTED' })
    )
  })

  it('rejects a stale timestamp', () => {
    const nonce = `nonce-stale-${Date.now()}`
    const { req } = signedRequest(nonce, {
      'x-webhook-timestamp': String(Math.floor(Date.now() / 1000) - 3600),
    })

    expect(() => guard.canActivate(contextFor(req))).toThrow(
      expect.objectContaining({ statusCode: 401 })
    )
  })

  it('rejects missing signature headers', () => {
    const { req } = signedRequest(`nonce-missing-${Date.now()}`, {
      'x-webhook-signature': '',
    })

    expect(() => guard.canActivate(contextFor(req))).toThrow(
      expect.objectContaining({ statusCode: 401 })
    )
  })

  it('rejects a replayed nonce with 409', () => {
    const nonce = `nonce-replay-${Date.now()}`
    const { req } = signedRequest(nonce)

    expect(guard.canActivate(contextFor(req))).toBe(true)
    expect(() => guard.canActivate(contextFor(req))).toThrow(
      expect.objectContaining({ statusCode: 409, code: 'WEBHOOK_REJECTED' })
    )
  })
})
