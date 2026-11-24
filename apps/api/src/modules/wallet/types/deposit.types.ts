import type { WalletDepositStatus } from "@prisma/client"
import type { Sep24TransactionStatus } from "../../../shared/anchor/sep24-client.js"

export interface WalletDeposit {
  id: string
  userId: string
  assetCode: string
  anchorTransactionId: string
  interactiveUrl: string
  status: WalletDepositStatus
  amountIn: string | null
  failureReason: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateWalletDepositInput {
  userId: string
  assetCode: string
  anchorTransactionId: string
  interactiveUrl: string
}

export interface WalletDepositResponse {
  id: string
  assetCode: string
  interactiveUrl: string
  status: Sep24TransactionStatus
  amountIn: string | null
  failureReason: string | null
  createdAt: string
}

export interface PaginatedDeposits {
  items: WalletDepositResponse[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage: boolean
}

export function toWalletDepositResponse(deposit: WalletDeposit): WalletDepositResponse {
  return {
    id: deposit.id,
    assetCode: deposit.assetCode,
    interactiveUrl: deposit.interactiveUrl,
    // Prisma's WalletDepositStatus mirrors SEP-24's vocabulary exactly.
    status: deposit.status as Sep24TransactionStatus,
    amountIn: deposit.amountIn,
    failureReason: deposit.failureReason,
    createdAt: deposit.createdAt.toISOString(),
  }
}
