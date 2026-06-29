import { prisma } from '../../../shared/database/prisma.js'
import type { PaymentIntent, CreatePaymentIntentInput, PaymentIntentStatus } from '@chordially/shared'
import { v4 as uuid } from 'uuid'

const INTENT_TTL_MS = 30 * 60 * 1000

export const paymentIntentService = {
  async create(userId: string, input: CreatePaymentIntentInput): Promise<PaymentIntent> {
    const intent = await prisma.paymentIntent.create({
      data: {
        id: uuid(),
        userId,
        recipientId: input.recipientId,
        amount: input.amount,
        currency: input.currency,
        network: input.network,
        memo: input.memo || null,
        status: 'pending',
        expiresAt: new Date(Date.now() + INTENT_TTL_MS),
      },
    })
    return this.toIntent(intent)
  },

  async get(intentId: string): Promise<PaymentIntent | null> {
    const intent = await prisma.paymentIntent.findUnique({ where: { id: intentId } })
    return intent ? this.toIntent(intent) : null
  },

  async confirm(intentId: string, stellarTxHash: string): Promise<PaymentIntent> {
    const intent = await prisma.paymentIntent.update({
      where: { id: intentId },
      data: { status: 'confirmed', stellarTxHash, updatedAt: new Date() },
    })
    return this.toIntent(intent)
  },

  async fail(intentId: string): Promise<PaymentIntent> {
    const intent = await prisma.paymentIntent.update({
      where: { id: intentId },
      data: { status: 'failed', updatedAt: new Date() },
    })
    return this.toIntent(intent)
  },

  async expireStale(): Promise<number> {
    const result = await prisma.paymentIntent.updateMany({
      where: { status: 'pending', expiresAt: { lt: new Date() } },
      data: { status: 'expired', updatedAt: new Date() },
    })
    return result.count
  },

  toIntent(r: any): PaymentIntent {
    return {
      id: r.id,
      userId: r.userId,
      recipientId: r.recipientId,
      amount: r.amount.toString(),
      currency: r.currency,
      network: r.network,
      memo: r.memo,
      status: r.status as PaymentIntentStatus,
      stellarTxHash: r.stellarTxHash,
      expiresAt: r.expiresAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }
  },
}
