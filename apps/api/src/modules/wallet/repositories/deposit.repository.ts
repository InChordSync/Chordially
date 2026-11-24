import type { WalletDepositStatus } from "@prisma/client"
import { prisma } from "../../../shared/database/prisma.js"
import type { CreateWalletDepositInput, WalletDeposit } from "../types/deposit.types.js"

export function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

export const depositRepository = {
  create(input: CreateWalletDepositInput): Promise<WalletDeposit> {
    return prisma.walletDeposit.create({ data: input })
  },

  /**
   * The anchor's transaction id is the idempotency anchor for webhooks. With
   * the unique index in place, a redelivered event either finds the existing
   * row or loses a race to insert it — both are the same idempotent result.
   */
  async findOrCreateByAnchorTransactionId(
    input: CreateWalletDepositInput
  ): Promise<{ deposit: WalletDeposit; created: boolean }> {
    const existing = await prisma.walletDeposit.findUnique({
      where: { anchorTransactionId: input.anchorTransactionId },
    })
    if (existing) return { deposit: existing, created: false }

    try {
      return { deposit: await this.create(input), created: true }
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const raced = await prisma.walletDeposit.findUnique({
          where: { anchorTransactionId: input.anchorTransactionId },
        })
        if (raced) return { deposit: raced, created: false }
      }
      throw error
    }
  },

  findById(id: string): Promise<WalletDeposit | null> {
    return prisma.walletDeposit.findUnique({ where: { id } })
  },

  findByAnchorTransactionId(anchorTransactionId: string): Promise<WalletDeposit | null> {
    return prisma.walletDeposit.findUnique({ where: { anchorTransactionId } })
  },

  findByUserId(userId: string): Promise<WalletDeposit[]> {
    return prisma.walletDeposit.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
  },

  findByUserIdPaginated(userId: string, page: number, pageSize: number): Promise<WalletDeposit[]> {
    return prisma.walletDeposit.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
  },

  countByUserId(userId: string): Promise<number> {
    return prisma.walletDeposit.count({ where: { userId } })
  },

  updateStatus(
    id: string,
    data: { status: WalletDepositStatus; amountIn?: string | null; failureReason?: string | null }
  ): Promise<WalletDeposit> {
    return prisma.walletDeposit.update({ where: { id }, data })
  },
}
