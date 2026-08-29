import http from "node:http"
import type { AddressInfo } from "node:net"
import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"
import { tipPayoutRepository } from "../../tips/repositories/tip-payout.repository.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password1!" })
  return { token: res.body.token as string, userId: res.body.user.id as string }
}

async function createCreatorWithProfileAndWallet(email: string, slug: string) {
  const { token, userId } = await registerAndLogin(email)
  await prisma.creatorProfile.create({ data: { userId, displayName: slug, slug } })
  const creator = await prisma.creatorProfile.findUniqueOrThrow({ where: { userId } })
  return { token, userId, creator }
}

interface ParsedEvent {
  id?: string
  data: Record<string, unknown>
}

function parseSseChunk(raw: string): ParsedEvent[] {
  return raw
    .split("\n\n")
    .filter((block) => block.trim().length > 0 && !block.startsWith(":"))
    .map((block) => {
      const lines = block.split("\n")
      const idLine = lines.find((line) => line.startsWith("id: "))
      const dataLine = lines.find((line) => line.startsWith("data: "))
      return {
        id: idLine?.slice(4),
        data: JSON.parse(dataLine!.slice(6)) as Record<string, unknown>,
      }
    })
}

let server: http.Server
let port: number

beforeEach(async () => {
  await prisma.tip.deleteMany()
  await prisma.stream.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      port = (server.address() as AddressInfo).port
      resolve()
    })
  })
})

afterEach(async () => {
  vi.restoreAllMocks()
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

function openSseConnection(path: string, token: string): Promise<{
  req: http.ClientRequest
  collectUntil: (predicate: (events: ParsedEvent[]) => boolean, timeoutMs?: number) => Promise<ParsedEvent[]>
}> {
  return new Promise((resolve, reject) => {
    const events: ParsedEvent[] = []
    let buffer = ""

    const req = http.get(
      { host: "127.0.0.1", port, path, headers: { Authorization: `Bearer ${token}` } },
      (res) => {
        res.on("data", (chunk: Buffer) => {
          buffer += chunk.toString("utf8")
          const parts = buffer.split("\n\n")
          buffer = parts.pop() ?? ""
          for (const part of parts) {
            if (part.trim().length > 0) {
              events.push(...parseSseChunk(`${part}\n\n`))
            }
          }
        })
        res.on("error", reject)

        resolve({
          req,
          collectUntil: (predicate, timeoutMs = 4000) =>
            new Promise((resolveCollect, rejectCollect) => {
              const start = Date.now()
              const interval = setInterval(() => {
                if (predicate(events)) {
                  clearInterval(interval)
                  resolveCollect([...events])
                } else if (Date.now() - start > timeoutMs) {
                  clearInterval(interval)
                  rejectCollect(new Error(`Timed out waiting for events: ${JSON.stringify(events)}`))
                }
              }, 20)
            }),
        })
      }
    )

    req.on("error", reject)
  })
}

describe("GET /api/streams/:id/tips (SSE feed)", () => {
  it("streams pending/submitted/confirmed events for a tip in order with no duplicates", async () => {
    const fan = await registerAndLogin("feed-fan@test.com")
    const { token: hostToken, creator } = await createCreatorWithProfileAndWallet(
      "feed-creator@test.com",
      "feed-creator"
    )

    const streamRes = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ title: "Live show" })
    const streamId = streamRes.body.id as string

    const { req: sseReq, collectUntil } = await openSseConnection(
      `/api/streams/${streamId}/tips`,
      hostToken
    )

    const tipRes = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${fan.token}`)
      .send({
        creatorId: creator.id,
        amount: "10",
        idempotencyKey: crypto.randomUUID(),
        streamId,
      })

    const tipId = tipRes.body.id as string

    const events = await collectUntil((collected) =>
      collected.some((event) => event.data.status === "confirmed" && event.data.tipId === tipId)
    )

    const statuses = events
      .filter((event) => event.data.tipId === tipId)
      .map((event) => event.data.status)

    expect(statuses).toEqual(["pending", "submitted", "confirmed"])

    // No duplicate events: each (tipId, status) pair appears exactly once.
    const seen = new Set(statuses)
    expect(seen.size).toBe(statuses.length)

    // Sequence numbers strictly increase.
    const seqs = events.map((event) => Number(event.id))
    expect(seqs).toEqual([...seqs].sort((a, b) => a - b))
    expect(new Set(seqs).size).toBe(seqs.length)

    sseReq.destroy()
  })

  it("sends a backlog snapshot (not full history) for tips that already happened", async () => {
    const fan = await registerAndLogin("backlog-fan@test.com")
    const { token: hostToken, creator } = await createCreatorWithProfileAndWallet(
      "backlog-creator@test.com",
      "backlog-creator"
    )

    const streamRes = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({})
    const streamId = streamRes.body.id as string

    const tipRes = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${fan.token}`)
      .send({ creatorId: creator.id, amount: "10", idempotencyKey: crypto.randomUUID(), streamId })
    const tipId = tipRes.body.id as string

    const { req: sseReq, collectUntil } = await openSseConnection(
      `/api/streams/${streamId}/tips`,
      hostToken
    )

    const events = await collectUntil((collected) => collected.length > 0)
    const tipEvents = events.filter((event) => event.data.tipId === tipId)

    // Only the tip's current (confirmed) state is replayed, not every
    // intermediate transition it already went through.
    expect(tipEvents).toHaveLength(1)
    expect(tipEvents[0]!.data.status).toBe("confirmed")

    sseReq.destroy()
  })

  it("includes each payee's share for a split tip", async () => {
    const fan = await registerAndLogin("split-feed-fan@test.com")
    const { token: hostToken, creator: host } = await createCreatorWithProfileAndWallet(
      "split-feed-host@test.com",
      "split-feed-host"
    )
    const { creator: bob } = await createCreatorWithProfileAndWallet(
      "split-feed-bob@test.com",
      "split-feed-bob"
    )

    const streamRes = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({})
    const streamId = streamRes.body.id as string

    await request(app)
      .put(`/api/streams/${streamId}/payout-config`)
      .set("Authorization", `Bearer ${hostToken}`)
      .send({
        payees: [
          { creatorId: host.id, percentage: 60 },
          { creatorId: bob.id, percentage: 40 },
        ],
      })

    const { req: sseReq, collectUntil } = await openSseConnection(
      `/api/streams/${streamId}/tips`,
      hostToken
    )

    const tipRes = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${fan.token}`)
      .send({
        creatorId: host.id,
        amount: "10",
        idempotencyKey: crypto.randomUUID(),
        streamId,
      })
    const tipId = tipRes.body.id as string

    const events = await collectUntil((collected) =>
      collected.some((event) => event.data.status === "confirmed" && event.data.tipId === tipId)
    )

    const confirmedEvent = events.find(
      (event) => event.data.tipId === tipId && event.data.status === "confirmed"
    )
    const payouts = confirmedEvent!.data.payouts as { creatorId: string; amount: string }[]

    expect(payouts).toHaveLength(2)
    expect(payouts.find((p) => p.creatorId === host.id)?.amount).toBe("6.0000000")
    expect(payouts.find((p) => p.creatorId === bob.id)?.amount).toBe("4.0000000")

    sseReq.destroy()
  })

  it("loads backlog payouts with a single batched query, not one per tip", async () => {
    const fan = await registerAndLogin("backlog-batch-fan@test.com")
    const { token: hostToken, creator } = await createCreatorWithProfileAndWallet(
      "backlog-batch-creator@test.com",
      "backlog-batch-creator"
    )

    const streamRes = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({})
    const streamId = streamRes.body.id as string

    // Two confirmed tips in the backlog before the feed connects.
    for (let i = 0; i < 2; i++) {
      const res = await request(app)
        .post("/api/tips")
        .set("Authorization", `Bearer ${fan.token}`)
        .send({
          creatorId: creator.id,
          amount: "10",
          idempotencyKey: crypto.randomUUID(),
          streamId,
        })
      expect(res.body.status).toBe("confirmed")
    }

    const findByTipIds = vi.spyOn(tipPayoutRepository, "findByTipIds")

    const { req: sseReq, collectUntil } = await openSseConnection(
      `/api/streams/${streamId}/tips`,
      hostToken
    )
    const events = await collectUntil((collected) => collected.length >= 2)

    expect(findByTipIds).toHaveBeenCalledTimes(1)
    expect(findByTipIds).toHaveBeenCalledWith(
      expect.arrayContaining(events.map((event) => event.data.tipId))
    )

    sseReq.destroy()
  })

  it("returns 401 for an unauthenticated request", async () => {
    const res = await request(app).get("/api/streams/does-not-exist/tips")
    expect(res.status).toBe(401)
  })

  it("returns 404 for an unknown stream", async () => {
    const { token } = await registerAndLogin("nostream-fan@test.com")
    const res = await request(app)
      .get("/api/streams/does-not-exist/tips")
      .set("Authorization", `Bearer ${token}`)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe("STREAM_NOT_FOUND")
  })
})
