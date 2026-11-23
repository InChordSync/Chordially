import { EventEmitter } from "node:events"
import type { TipPayoutResponse } from "../../modules/tips/types/tip-payout.types.js"
import type { TipStatus } from "../../modules/tips/types/tip.types.js"

export interface TipFeedEvent {
  /** Monotonically increasing across the whole process; used as the SSE event id. */
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

/**
 * In-process pub/sub for live tip events. This is intentionally a single
 * EventEmitter rather than an external broker: it's enough for a single API
 * instance, which matches the MVP scope here. A multi-instance deployment
 * would need to swap this for something like Redis pub/sub without changing
 * any of the calling code below.
 */
const emitter = new EventEmitter()
emitter.setMaxListeners(0)

let seqCounter = 0

function channel(streamId: string): string {
  return `tip-feed:${streamId}`
}

export const tipEventBus = {
  publish(event: Omit<TipFeedEvent, "seq" | "emittedAt">): TipFeedEvent {
    const fullEvent: TipFeedEvent = {
      ...event,
      seq: ++seqCounter,
      emittedAt: new Date().toISOString(),
    }

    emitter.emit(channel(event.streamId), fullEvent)

    return fullEvent
  },

  subscribe(streamId: string, listener: (event: TipFeedEvent) => void): () => void {
    const eventName = channel(streamId)
    emitter.on(eventName, listener)
    return () => emitter.off(eventName, listener)
  },

  close(): void {
    emitter.removeAllListeners()
  },
}
