import type { NextFunction, Request, Response } from "express"
import { AppError } from "../../../shared/errors/app-error.js"
import { tipEventBus, type TipFeedEvent } from "../../../shared/realtime/tip-event-bus.js"
import { tipPayoutRepository } from "../../tips/repositories/tip-payout.repository.js"
import { tipRepository } from "../../tips/repositories/tip.repository.js"
import { toTipPayoutResponse } from "../../tips/types/tip-payout.types.js"
import type { TipPayout } from "../../tips/types/tip-payout.types.js"
import type { Tip, TipStatus } from "../../tips/types/tip.types.js"
import { streamService } from "../services/stream.service.js"
import { toStreamResponse } from "../types/stream.types.js"

const HEARTBEAT_INTERVAL_MS = 20_000

type TipFeedPayload = Omit<TipFeedEvent, "seq" | "emittedAt">

export function buildTipFeedPayloads(
  tips: Tip[],
  payoutsByTipId: Map<string, TipPayout[]>
): TipFeedPayload[] {
  return tips.map((tip) => {
    const payouts = payoutsByTipId.get(tip.id) ?? []

    return {
      streamId: tip.streamId!,
      tipId: tip.id,
      creatorId: tip.creatorId,
      fanUserId: tip.fanUserId,
      amount: tip.amount,
      status: tip.status as TipStatus,
      txHash: tip.txHash,
      failureReason: tip.failureReason,
      ...(payouts.length > 0 ? { payouts: payouts.map(toTipPayoutResponse) } : {}),
    }
  })
}

async function loadBacklogPayouts(tipIds: string[]): Promise<Map<string, TipPayout[]>> {
  if (tipIds.length === 0) {
    return new Map()
  }
  const payouts = await tipPayoutRepository.findByTipIds(tipIds)
  const payoutsByTipId = new Map<string, TipPayout[]>()
  for (const payout of payouts) {
    const existing = payoutsByTipId.get(payout.tipId) ?? []
    existing.push(payout)
    payoutsByTipId.set(payout.tipId, existing)
  }
  return payoutsByTipId
}

export const streamController = {
  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hostUserId = req.userId!
      const { title } = req.body as { title?: string }

      const stream = await streamService.startStream(hostUserId, title)

      res.status(201).json(toStreamResponse(stream))
    } catch (error) {
      next(error)
    }
  },

  async end(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hostUserId = req.userId!
      const { id } = req.params

      const stream = await streamService.endStream(id!, hostUserId)

      res.status(200).json(toStreamResponse(stream))
    } catch (error) {
      next(error)
    }
  },

  async streamTips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: streamId } = req.params
      const stream = await streamService.findById(streamId!)

      if (!stream) {
        throw new AppError(404, "STREAM_NOT_FOUND", "Stream not found")
      }

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      })
      // writeHead() only queues the headers; without an explicit flush they
      // sit unsent until the first body write, which can be a long time
      // away (empty backlog + only a periodic heartbeat). Force them out
      // immediately so clients see the connection open right away.
      res.flushHeaders()

      // Late joiners get every tip's current state so they aren't blind to
      // what already happened. Each tip appears once here (its latest
      // status), so this can never race with / duplicate a live event for
      // a tip that's still in flight.
      const backlog = await tipRepository.findByStreamId(streamId!)
      const payoutsByTipId = await loadBacklogPayouts(backlog.map((tip) => tip.id))
      for (const payload of buildTipFeedPayloads(backlog, payoutsByTipId)) {
        writeEvent(res, payload)
      }

      const unsubscribe = tipEventBus.subscribe(streamId!, (event) => {
        writeEvent(res, event, event.seq)
      })

      const heartbeat = setInterval(() => {
        res.write(": heartbeat\n\n")
      }, HEARTBEAT_INTERVAL_MS)

      req.on("close", () => {
        clearInterval(heartbeat)
        unsubscribe()
        res.end()
      })
    } catch (error) {
      next(error)
    }
  },
}

function writeEvent(res: Response, payload: TipFeedPayload, seq?: number): void {
  if (seq !== undefined) {
    res.write(`id: ${seq}\n`)
  }
  res.write(`event: tip\n`)
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}
