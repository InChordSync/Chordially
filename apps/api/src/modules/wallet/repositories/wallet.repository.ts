import { prisma } from "../../../shared/database/prisma.js"
import type {
  CreateCustodialWalletInput,
  CreateLinkedWalletInput,
  Wallet,
} from "../types/wallet.types.js"

export const walletRepository = {
  findByUserId(userId: string): Promise<Wallet | null> {
    return prisma.wallet.findUnique({ where: { userId } })
  },

  findByPublicKey(publicKey: string): Promise<Wallet | null> {
    return prisma.wallet.findUnique({ where: { publicKey } })
  },

  create(input: CreateCustodialWalletInput): Promise<Wallet> {
    return prisma.wallet.create({ data: { ...input, walletType: "custodial" } })
  },

  createLinked(input: CreateLinkedWalletInput): Promise<Wallet> {
    return prisma.wallet.create({ data: { ...input, walletType: "linked" } })
  },

  markUsdcTrustlineEstablished(userId: string): Promise<Wallet> {
    return prisma.wallet.update({ where: { userId }, data: { usdcTrustline: true } })
  },
}
