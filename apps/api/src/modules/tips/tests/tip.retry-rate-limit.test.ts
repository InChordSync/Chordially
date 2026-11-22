import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"
import { walletService } from "../../wallet/services/wallet.service.js"
import { tipStreamRateLimiter } from "../services/tip-rate-limiters.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password1!" })
  return { token: res.body.token as string, userId: res.body.user.id as string }
}

async function createFailedStreamTip(fanUserId: string) {
  const creatorUser = await prisma.user.create({
    data: { email: "rrl-creator@test.com", passwordHash: "hash" },
  })
  const creator = await prisma.creatorProfile.create({
    data: { userId: creatorUser.id, displayName: "RR Creator", slug: "rr-creator" },
  })
  const stream = await prisma.stream.create({ data: { creatorId: creator.id } })
  const tip = await prisma.tip.create({
    data: {
      fanUserId,
      creatorId: creator.id,
      streamId: stream.id,
      amount: "5",
      idempotencyKey: crypto.randomUUID(),
      status: "failed",
    },
  })
  return { tip, stream, creator, creatorUserId: creatorUser.id }
}

afterEach(() => {
  vi.restoreAllMocks()
})

beforeEach(async () => {
  await prisma.tip.deleteMany()
  await prisma.stream.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

describe("POST /api/tips/:id/retry rate limiting", () => {
  it("returns 429 STREAM_RATE_LIMITED when a stream-scoped retry exceeds the stream limiter", async () => {
    const fan = await registerAndLogin("rrl-fan-limit@test.com")
    const { tip, stream } = await createFailedStreamTip(fan.userId)

    const consume = vi.spyOn(tipStreamRateLimiter, "consume").mockReturnValue(false)

    const res = await request(app)
      .post(`/api/tips/${tip.id}/retry`)
      .set("Authorization", `Bearer ${fan.token}`)

    expect(res.status).toBe(429)
    expect(res.body.error.code).toBe("STREAM_RATE_LIMITED")
    expect(consume).toHaveBeenCalledWith(stream.id)
  })

  it("consumes the stream limiter for a stream-scoped retry", async () => {
    const fan = await registerAndLogin("rrl-fan-scope@test.com")
    const { tip, stream, creatorUserId } = await createFailedStreamTip(fan.userId)
    await walletService.createWalletForUser(creatorUserId)

    const consume = vi.spyOn(tipStreamRateLimiter, "consume")

    const res = await request(app)
      .post(`/api/tips/${tip.id}/retry`)
      .set("Authorization", `Bearer ${fan.token}`)

    expect(res.status).toBe(201)
    expect(consume).toHaveBeenCalledWith(stream.id)
  })

  it("does not touch the stream limiter for a non-stream retry", async () => {
    const fan = await registerAndLogin("rrl-fan-plain@test.com")
    const creator = await prisma.creatorProfile.create({
      data: {
        userId: fan.userId,
        displayName: "RR Plain Creator",
        slug: "rr-plain-creator",
      },
    })
    const tip = await prisma.tip.create({
      data: {
        fanUserId: fan.userId,
        creatorId: creator.id,
        amount: "5",
        idempotencyKey: crypto.randomUUID(),
        status: "failed",
      },
    })

    const consume = vi.spyOn(tipStreamRateLimiter, "consume")

    const res = await request(app)
      .post(`/api/tips/${tip.id}/retry`)
      .set("Authorization", `Bearer ${fan.token}`)

    expect(res.status).toBe(201)
    expect(consume).not.toHaveBeenCalled()
  })
})