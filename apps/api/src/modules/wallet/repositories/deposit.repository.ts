import { prisma } from "../../../shared/database/prisma.js"
import type { CreateWalletDepositInput, WalletDeposit } from "../types/deposit.types.js"

export const depositRepository = {
  create(input: CreateWalletDepositInput): Promise<WalletDeposit> {
    return prisma.walletDeposit.create({ data: input })
  },

  findById(id: string): Promise<WalletDeposit | null> {
    return prisma.walletDeposit.findUnique({ where: { id } })
  },

  findByUserId(userId: string): Promise<WalletDeposit[]> {
    return prisma.walletDeposit.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
  },

  updateStatus(
    id: string,
    data: { status: string; amountIn?: string | null; failureReason?: string | null }
  ): Promise<WalletDeposit> {
    return prisma.walletDeposit.update({ where: { id }, data })
  },
}
