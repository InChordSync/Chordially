import { prisma } from "../../../shared/database/prisma.js"
import type { CreateCreatorPayoutInput, CreatorPayout } from "../types/creator-payout.types.js"

export const creatorPayoutRepository = {
  findByIdempotencyKey(creatorId: string, idempotencyKey: string): Promise<CreatorPayout | null> {
    return prisma.creatorPayout.findUnique({
      where: { creatorId_idempotencyKey: { creatorId, idempotencyKey } },
    })
  },

  create(input: CreateCreatorPayoutInput): Promise<CreatorPayout> {
    return prisma.creatorPayout.create({
      data: { ...input, status: "awaiting_anchor_details" },
    })
  },

  findById(id: string): Promise<CreatorPayout | null> {
    return prisma.creatorPayout.findUnique({ where: { id } })
  },

  findByCreatorId(creatorId: string): Promise<CreatorPayout[]> {
    return prisma.creatorPayout.findMany({
      where: { creatorId },
      orderBy: { createdAt: "desc" },
    })
  },

  markSubmitted(id: string, txHash: string, attempts: number): Promise<CreatorPayout> {
    return prisma.creatorPayout.update({
      where: { id },
      data: { status: "submitted", txHash, attempts },
    })
  },

  markCompleted(id: string): Promise<CreatorPayout> {
    return prisma.creatorPayout.update({ where: { id }, data: { status: "completed" } })
  },

  markFailed(id: string, failureReason: string, attempts: number): Promise<CreatorPayout> {
    return prisma.creatorPayout.update({
      where: { id },
      data: { status: "failed", failureReason, attempts },
    })
  },
}
