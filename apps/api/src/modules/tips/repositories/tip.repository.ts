import { prisma } from "../../../shared/database/prisma.js"
import type { CreateTipInput, Tip } from "../types/tip.types.js"

export const tipRepository = {
  findByIdempotencyKey(fanUserId: string, idempotencyKey: string): Promise<Tip | null> {
    return prisma.tip.findUnique({
      where: { fanUserId_idempotencyKey: { fanUserId, idempotencyKey } },
    })
  },

  create(input: CreateTipInput): Promise<Tip> {
    return prisma.tip.create({
      data: {
        fanUserId: input.fanUserId,
        creatorId: input.creatorId,
        streamId: input.streamId,
        amount: input.amount,
        asset: input.asset ?? "native",
        idempotencyKey: input.idempotencyKey,
        retriedFromTipId: input.retriedFromTipId,
        status: "pending",
      },
    })
  },

  findByStreamId(streamId: string): Promise<Tip[]> {
    return prisma.tip.findMany({ where: { streamId }, orderBy: { createdAt: "asc" } })
  },

  findById(id: string): Promise<Tip | null> {
    return prisma.tip.findUnique({ where: { id } })
  },

  /** Tips stuck in "submitted" since before the given cutoff — reconciliation's input. */
  findStuckSubmitted(updatedBefore: Date): Promise<Tip[]> {
    return prisma.tip.findMany({
      where: { status: "submitted", updatedAt: { lte: updatedBefore } },
      orderBy: { updatedAt: "asc" },
    })
  },

  updateStatus(id: string, status: string): Promise<Tip> {
    return prisma.tip.update({ where: { id }, data: { status } })
  },

  markSubmitted(id: string, attempts: number): Promise<Tip> {
    return prisma.tip.update({ where: { id }, data: { status: "submitted", attempts } })
  },

  markConfirmed(id: string, txHash: string, attempts: number): Promise<Tip> {
    return prisma.tip.update({
      where: { id },
      data: { status: "confirmed", txHash, attempts },
    })
  },

  markFailed(id: string, failureReason: string, attempts: number): Promise<Tip> {
    return prisma.tip.update({
      where: { id },
      data: { status: "failed", failureReason, attempts },
    })
  },
}
