import { prisma } from '../../../shared/database/prisma.js'
import type { PaymentReceipt, TipRequest, TransactionConfirmation, EarningsSummary } from '@chordially/shared'
import { v4 as uuid } from 'uuid'

export const paymentService = {
  async createReceipt(data: {
    userId: string
    recipientId: string
    amount: number
    currency: string
    network: string
    memo?: string
  }): Promise<PaymentReceipt> {
    const receipt = await prisma.paymentReceipt.create({
      data: {
        id: uuid(),
        userId: data.userId,
        recipientId: data.recipientId,
        amount: data.amount,
        currency: data.currency,
        status: 'pending',
        network: data.network,
        memo: data.memo || null,
      },
    })
    return this.toReceipt(receipt)
  },

  async confirmReceipt(receiptId: string, txHash: string): Promise<PaymentReceipt> {
    const receipt = await prisma.paymentReceipt.update({
      where: { id: receiptId },
      data: { status: 'confirmed', txHash, confirmedAt: new Date() },
    })
    return this.toReceipt(receipt)
  },

  async failReceipt(receiptId: string): Promise<PaymentReceipt> {
    const receipt = await prisma.paymentReceipt.update({
      where: { id: receiptId },
      data: { status: 'failed' },
    })
    return this.toReceipt(receipt)
  },

  async getReceipt(receiptId: string): Promise<PaymentReceipt | null> {
    const receipt = await prisma.paymentReceipt.findUnique({ where: { id: receiptId } })
    return receipt ? this.toReceipt(receipt) : null
  },

  async getUserReceipts(userId: string): Promise<PaymentReceipt[]> {
    const receipts = await prisma.paymentReceipt.findMany({
      where: { OR: [{ userId }, { recipientId: userId }] },
      orderBy: { createdAt: 'desc' },
    })
    return receipts.map(r => this.toReceipt(r))
  },

  async getEarningsSummary(creatorId: string): Promise<EarningsSummary> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const receipts = await prisma.paymentReceipt.findMany({
      where: { recipientId: creatorId, status: 'confirmed' },
    })

    const periodReceipts = receipts.filter(r => r.createdAt >= startOfMonth && r.createdAt <= endOfMonth)
    const totalEarned = periodReceipts.reduce((sum, r) => sum + Number(r.amount), 0)

    const tippedCount = receipts.length
    const pendingReceipts = await prisma.paymentReceipt.findMany({
      where: { recipientId: creatorId, status: 'pending' },
    })
    const pendingAmount = pendingReceipts.reduce((sum, r) => sum + Number(r.amount), 0)

    return {
      totalEarned,
      currency: 'XLM',
      pendingAmount,
      paidOut: totalEarned - pendingAmount,
      periodStart: startOfMonth.toISOString(),
      periodEnd: endOfMonth.toISOString(),
      breakdown: [{ source: 'tips', amount: totalEarned, count: tippedCount }],
    }
  },

  toReceipt(r: any): PaymentReceipt {
    return {
      id: r.id,
      userId: r.userId,
      recipientId: r.recipientId,
      amount: Number(r.amount),
      currency: r.currency,
      status: r.status,
      txHash: r.txHash,
      network: r.network,
      memo: r.memo,
      createdAt: r.createdAt.toISOString(),
      confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString() : null,
    }
  },
}
