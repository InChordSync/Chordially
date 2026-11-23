import type { TipPayoutResponse } from "../../modules/tips/types/tip-payout.types.js"
import type { TipStatus } from "../../modules/tips/types/tip.types.js"

export interface TipFeedEvent {
  /** Monotonically increasing within the publishing process; used as the SSE event id. */
  seq: number
  streamId: string
  tipId: string
  creatorId: string
  fanUserId: string
  amount: string
  status: TipStatus
  txHash: string | null
  failureReason: string | null
  emittedAt: string
  /** Present only for split tips: each payee's share and individual status. */
  payouts?: TipPayoutResponse[]
}

export type TipEventInput = Omit<TipFeedEvent, "seq" | "emittedAt">
export type TipEventListener = (event: TipFeedEvent) => void

/** Pub/sub contract shared by the in-memory and Redis adapters. */
export interface TipEventBus {
  publish(event: TipEventInput): TipFeedEvent
  subscribe(streamId: string, listener: TipEventListener): () => void
}

export function tipEventChannel(streamId: string): string {
  return `tip-feed:${streamId}`
}

let seqCounter = 0

/** Stamps publisher-side fields so both adapters emit the same event shape. */
export function toTipFeedEvent(event: TipEventInput): TipFeedEvent {
  return {
    ...event,
    seq: ++seqCounter,
    emittedAt: new Date().toISOString(),
  }
}
