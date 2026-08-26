import type { TipAssetCode } from "../../../shared/stellar/assets.js"
import { toTipPayoutResponse, type TipPayout, type TipPayoutResponse } from "./tip-payout.types.js"

export type TipStatus = "pending" | "submitted" | "confirmed" | "failed"
export type { TipAssetCode }

export interface Tip {
  id: string
  idempotencyKey: string
  fanUserId: string
  creatorId: string
  streamId: string | null
  amount: string
  asset: string
  status: string
  txHash: string | null
  failureReason: string | null
  attempts: number
  createdAt: Date
  updatedAt: Date
  retriedFromTipId: string | null
}

export interface CreateTipInput {
  fanUserId: string
  creatorId: string
  amount: string
  idempotencyKey: string
  streamId?: string
  retriedFromTipId?: string
  asset?: TipAssetCode
}

export interface TipResponse {
  id: string
  creatorId: string
  streamId: string | null
  amount: string
  asset: string
  status: TipStatus
  txHash: string | null
  failureReason: string | null
  retriedFromTipId: string | null
  payouts?: TipPayoutResponse[]
}

export function toTipResponse(tip: Tip, payouts?: TipPayout[]): TipResponse {
  return {
    id: tip.id,
    creatorId: tip.creatorId,
    streamId: tip.streamId,
    amount: tip.amount,
    asset: tip.asset,
    status: tip.status as TipStatus,
    txHash: tip.txHash,
    failureReason: tip.failureReason,
    retriedFromTipId: tip.retriedFromTipId,
    ...(payouts && payouts.length > 0
      ? { payouts: payouts.map(toTipPayoutResponse) }
      : {}),
  }
}
