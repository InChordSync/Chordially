import type { CreatorPayoutStatus as PrismaCreatorPayoutStatus } from "@prisma/client"

// Declaration lives in schema.prisma; this alias keeps the public type name.
export type CreatorPayoutStatus = PrismaCreatorPayoutStatus

export interface CreatorPayout {
  id: string
  idempotencyKey: string
  creatorId: string
  assetCode: string
  amount: string
  status: CreatorPayoutStatus
  anchorTransactionId: string
  interactiveUrl: string
  txHash: string | null
  failureReason: string | null
  attempts: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateCreatorPayoutInput {
  creatorId: string
  assetCode: string
  amount: string
  idempotencyKey: string
  anchorTransactionId: string
  interactiveUrl: string
}

export interface CreatorPayoutResponse {
  id: string
  assetCode: string
  amount: string
  status: CreatorPayoutStatus
  interactiveUrl: string
  txHash: string | null
  failureReason: string | null
  createdAt: string
}

export interface PaginatedCreatorPayouts {
  items: CreatorPayoutResponse[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage: boolean
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export function toCreatorPayoutResponse(payout: CreatorPayout): CreatorPayoutResponse {
  return {
    id: payout.id,
    assetCode: payout.assetCode,
    amount: payout.amount,
    status: payout.status,
    interactiveUrl: payout.interactiveUrl,
    txHash: payout.txHash,
    failureReason: payout.failureReason,
    createdAt: payout.createdAt.toISOString(),
  }
}
