import type { Sep24TransactionStatus } from "../../../shared/anchor/sep24-client.js"

export interface WalletDeposit {
  id: string
  userId: string
  assetCode: string
  anchorTransactionId: string
  interactiveUrl: string
  status: string
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

export function toWalletDepositResponse(deposit: WalletDeposit): WalletDepositResponse {
  return {
    id: deposit.id,
    assetCode: deposit.assetCode,
    interactiveUrl: deposit.interactiveUrl,
    status: deposit.status as Sep24TransactionStatus,
    amountIn: deposit.amountIn,
    failureReason: deposit.failureReason,
    createdAt: deposit.createdAt.toISOString(),
  }
}
