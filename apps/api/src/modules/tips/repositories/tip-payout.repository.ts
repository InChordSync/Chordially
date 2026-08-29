import type { Prisma } from "@prisma/client"
import { prisma } from "../../../shared/database/prisma.js"
import type { CreateTipPayoutInput, TipPayout } from "../types/tip-payout.types.js"

export const tipPayoutRepository = {
  findByTipId(tipId: string): Promise<TipPayout[]> {
    return prisma.tipPayout.findMany({ where: { tipId }, orderBy: { createdAt: "asc" } })
  },

  findByTipIds(tipIds: string[]): Promise<TipPayout[]> {
    return prisma.tipPayout.findMany({
      where: { tipId: { in: tipIds } },
      orderBy: { createdAt: "asc" },
    })
  },

  createMany(inputs: CreateTipPayoutInput[]): Promise<TipPayout[]> {
    return prisma.$transaction(
      inputs.map((input) =>
        prisma.tipPayout.create({
          data: {
            tipId: input.tipId,
            creatorId: input.creatorId,
            percentage: input.percentage,
            amount: input.amount,
            status: "pending",
          },
        })
      )
    )
  },

  updateStatusForTip(tipId: string, status: string): Promise<Prisma.BatchPayload> {
    return prisma.tipPayout.updateMany({ where: { tipId }, data: { status } })
  },

  markConfirmedForTip(tipId: string, txHash: string): Promise<Prisma.BatchPayload> {
    return prisma.tipPayout.updateMany({
      where: { tipId },
      data: { status: "confirmed", txHash },
    })
  },

  markFailedForTip(tipId: string, failureReason: string): Promise<Prisma.BatchPayload> {
    return prisma.tipPayout.updateMany({
      where: { tipId },
      data: { status: "failed", failureReason },
    })
  },
}
