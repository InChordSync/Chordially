import type { NextFunction, Request, Response } from "express"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  buildTipFeedPayloads,
  streamController,
} from "../controllers/stream.controller.js"
import { streamService } from "../services/stream.service.js"
import { tipPayoutRepository } from "../../tips/repositories/tip-payout.repository.js"
import { tipRepository } from "../../tips/repositories/tip.repository.js"
import type { TipPayout } from "../../tips/types/tip-payout.types.js"
import type { Tip } from "../../tips/types/tip.types.js"

const STREAM_ID = "stream-backlog"

function makeTip(id: string, streamId: string): Tip {
  return {
    id,
    idempotencyKey: `key-${id}`,
    fanUserId: `fan-${id}`,
    creatorId: `creator-${id}`,
    streamId,
    amount: "10",
    asset: "native",
    status: "confirmed",
    unsignedTransactionXdr: null,
    txHash: `hash-${id}`,
    failureReason: null,
    attempts: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    retriedFromTipId: null,
  }
}

function makePayout(id: string, tipId: string): TipPayout {
  return {
    id,
    tipId,
    creatorId: `creator-${id}`,
    percentage: 100,
    amount: "10",
    status: "confirmed",
    txHash: `hash-${id}`,
    failureReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("streamTips backlog payout loading", () => {
  it("builds backlog payloads from a grouped payout map", async () => {
    const tips = [makeTip("tip-1", STREAM_ID), makeTip("tip-2", STREAM_ID), makeTip("tip-3", STREAM_ID)]
    const payoutsByTipId = new Map([
      ["tip-1", [makePayout("p1", "tip-1")]],
      ["tip-3", [makePayout("p3", "tip-3")]],
    ])

    const payloads = buildTipFeedPayloads(tips, payoutsByTipId)

    expect(payloads).toHaveLength(3)
    expect(payloads.map((p) => p.tipId)).toEqual(["tip-1", "tip-2", "tip-3"])
    expect(payloads[0]!.payouts).toHaveLength(1)
    expect(payloads[1]!.payouts).toBeUndefined()
    expect(payloads[2]!.payouts).toHaveLength(1)
  })

  it("issues one batched payout query for the whole backlog, not one per tip", async () => {
    const tips = [makeTip("tip-1", STREAM_ID), makeTip("tip-2", STREAM_ID), makeTip("tip-3", STREAM_ID)]

    vi.spyOn(streamService, "findById").mockResolvedValue({ id: STREAM_ID } as never)
    vi.spyOn(tipRepository, "findByStreamId").mockResolvedValue(tips)
    const findByTipIds = vi
      .spyOn(tipPayoutRepository, "findByTipIds")
      .mockResolvedValue([makePayout("p1", "tip-1"), makePayout("p3", "tip-3")])

    let closeHandler: () => void = () => {}
    const req = {
      params: { id: STREAM_ID },
      userId: "host-user",
      on: vi.fn((event: string, cb: () => void) => {
        if (event === "close") closeHandler = cb
        return req
      }),
    } as unknown as Request
    const res = {
      writeHead: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    } as unknown as Response

    await streamController.streamTips(req, res, vi.fn() as unknown as NextFunction)
    closeHandler()

    expect(findByTipIds).toHaveBeenCalledTimes(1)
    expect(findByTipIds).toHaveBeenCalledWith(["tip-1", "tip-2", "tip-3"])

    const written = res.write as ReturnType<typeof vi.fn>
    const serialized = written.mock.calls.map((call) => String(call[0])).join("")
    expect(serialized).toContain('"tipId":"tip-1"')
    expect(serialized).toContain('"tipId":"tip-2"')
    expect(serialized).toContain('"tipId":"tip-3"')
    expect(serialized).toContain('"payouts":[{"creatorId":"creator-p1"')
  })
})