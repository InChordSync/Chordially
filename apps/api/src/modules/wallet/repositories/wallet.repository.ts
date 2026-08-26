import { prisma } from "../../../shared/database/prisma.js"
import type { CreateWalletInput, Wallet } from "../types/wallet.types.js"

export const walletRepository = {
  findByUserId(userId: string): Promise<Wallet | null> {
    return prisma.wallet.findUnique({ where: { userId } })
  },

  create(input: CreateWalletInput): Promise<Wallet> {
    return prisma.wallet.create({ data: input })
  },

  markUsdcTrustlineEstablished(userId: string): Promise<Wallet> {
    return prisma.wallet.update({ where: { userId }, data: { usdcTrustline: true } })
  },
}
