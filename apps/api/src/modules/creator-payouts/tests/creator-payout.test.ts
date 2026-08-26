import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"
import { anchorClient } from "../../../shared/anchor/client.js"
import { prisma } from "../../../shared/database/prisma.js"
import { stellarClient } from "../../../shared/stellar/client.js"

const app = createApp()

async function registerAndLoginCreator(email: string, slug: string) {
  await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  const login = await request(app).post("/api/auth/login").send({ email, password: "Password1!" })
  const token = login.body.token as string
  const userId = login.body.user.id as string

  const creator = await prisma.creatorProfile.create({
    data: { userId, displayName: slug, slug },
  })

  return { token, userId, creator }
}

beforeEach(() => {
  vi.mocked(anchorClient.requestChallenge).mockClear()
  vi.mocked(anchorClient.submitChallenge).mockClear()
  vi.mocked(anchorClient.startInteractiveWithdrawal).mockClear()
  vi.mocked(anchorClient.fetchTransaction).mockReset()
  vi.mocked(anchorClient.fetchTransaction).mockResolvedValue({ status: "incomplete" })
  vi.mocked(stellarClient.getAssetBalance).mockReset()
  vi.mocked(stellarClient.getAssetBalance).mockResolvedValue("1000.0000000")
  vi.mocked(stellarClient.submitPayment).mockClear()
})

describe("POST /api/creator-payouts", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/creator-payouts").send({})
    expect(res.status).toBe(401)
  })

  it("requires a creator profile", async () => {
    await request(app).post("/api/auth/register").send({ email: "no-creator@test.com", password: "Password1!" })
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "no-creator@test.com", password: "Password1!" })

    const res = await request(app)
      .post("/api/creator-payouts")
      .set("Authorization", `Bearer ${login.body.token}`)
      .send({ amount: "20", idempotencyKey: crypto.randomUUID() })

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe("CREATOR_PROFILE_NOT_FOUND")
  })

  it("rejects a payout below the minimum amount", async () => {
    const { token } = await registerAndLoginCreator("payout-min@test.com", "payout-min")

    const res = await request(app)
      .post("/api/creator-payouts")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: "1", idempotencyKey: crypto.randomUUID() })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe("PAYOUT_BELOW_MINIMUM")
  })

  it("rejects a payout larger than the wallet's balance", async () => {
    const { token } = await registerAndLoginCreator("payout-insufficient@test.com", "payout-insufficient")
    vi.mocked(stellarClient.getAssetBalance).mockResolvedValueOnce("5.0000000")

    const res = await request(app)
      .post("/api/creator-payouts")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: "20", idempotencyKey: crypto.randomUUID() })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe("INSUFFICIENT_BALANCE")
  })

  it("starts an interactive withdrawal and is idempotent on a duplicate key", async () => {
    const { token } = await registerAndLoginCreator("payout-happy@test.com", "payout-happy")
    const idempotencyKey = crypto.randomUUID()

    const first = await request(app)
      .post("/api/creator-payouts")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: "20", idempotencyKey })

    expect(first.status).toBe(201)
    expect(first.body.status).toBe("awaiting_anchor_details")
    expect(typeof first.body.interactiveUrl).toBe("string")

    const second = await request(app)
      .post("/api/creator-payouts")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: "20", idempotencyKey })

    expect(second.body.id).toBe(first.body.id)
    expect(vi.mocked(anchorClient.startInteractiveWithdrawal)).toHaveBeenCalledTimes(1)
  })
})

describe("GET /api/creator-payouts/:id", () => {
  it("submits the on-chain leg once the anchor provides a receiving account", async () => {
    const { token } = await registerAndLoginCreator("payout-submit@test.com", "payout-submit")

    const created = await request(app)
      .post("/api/creator-payouts")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: "20", idempotencyKey: crypto.randomUUID() })

    vi.mocked(anchorClient.fetchTransaction).mockResolvedValueOnce({
      status: "pending_user_transfer_start",
      withdrawAnchorAccount: "GANCHORRECEIVINGACCOUNTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    })
    vi.mocked(stellarClient.submitPayment).mockResolvedValueOnce({
      hash: "payout-onchain-hash",
      ledger: 10,
      successful: true,
    })

    const res = await request(app)
      .get(`/api/creator-payouts/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("submitted")
    expect(stellarClient.submitPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        destinationPublicKey: "GANCHORRECEIVINGACCOUNTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        amount: "20",
      })
    )

    const stored = await prisma.creatorPayout.findUniqueOrThrow({ where: { id: created.body.id } })
    expect(stored.status).toBe("submitted")
    expect(stored.txHash).toBe("payout-onchain-hash")
  })

  it("completes once the anchor confirms receipt after the on-chain leg was submitted", async () => {
    const { token } = await registerAndLoginCreator("payout-complete@test.com", "payout-complete")

    const created = await request(app)
      .post("/api/creator-payouts")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: "20", idempotencyKey: crypto.randomUUID() })

    await prisma.creatorPayout.update({
      where: { id: created.body.id },
      data: { status: "submitted", txHash: "already-submitted-hash", attempts: 1 },
    })

    vi.mocked(anchorClient.fetchTransaction).mockResolvedValueOnce({ status: "completed" })

    const res = await request(app)
      .get(`/api/creator-payouts/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("completed")
    expect(stellarClient.submitPayment).not.toHaveBeenCalled()
  })

  it("fails the payout when the anchor reports an error", async () => {
    const { token } = await registerAndLoginCreator("payout-error@test.com", "payout-error")

    const created = await request(app)
      .post("/api/creator-payouts")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: "20", idempotencyKey: crypto.randomUUID() })

    vi.mocked(anchorClient.fetchTransaction).mockResolvedValueOnce({
      status: "error",
      message: "Compliance review failed",
    })

    const res = await request(app)
      .get(`/api/creator-payouts/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("failed")
    expect(res.body.failureReason).toBe("Compliance review failed")
  })

  it("does not re-poll or resubmit once a payout has reached a terminal status", async () => {
    const { token } = await registerAndLoginCreator("payout-terminal@test.com", "payout-terminal")

    const created = await request(app)
      .post("/api/creator-payouts")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: "20", idempotencyKey: crypto.randomUUID() })

    await prisma.creatorPayout.update({
      where: { id: created.body.id },
      data: { status: "completed" },
    })

    vi.mocked(anchorClient.fetchTransaction).mockClear()

    const res = await request(app)
      .get(`/api/creator-payouts/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("completed")
    expect(anchorClient.fetchTransaction).not.toHaveBeenCalled()
  })

  it("returns 404 for a payout that isn't the caller's", async () => {
    const owner = await registerAndLoginCreator("payout-owner@test.com", "payout-owner")
    const other = await registerAndLoginCreator("payout-other@test.com", "payout-other")

    const created = await request(app)
      .post("/api/creator-payouts")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ amount: "20", idempotencyKey: crypto.randomUUID() })

    const res = await request(app)
      .get(`/api/creator-payouts/${created.body.id}`)
      .set("Authorization", `Bearer ${other.token}`)

    expect(res.status).toBe(404)
  })
})

describe("GET /api/creator-payouts", () => {
  it("lists only the caller's own payouts", async () => {
    const { token } = await registerAndLoginCreator("payout-list@test.com", "payout-list")

    await request(app)
      .post("/api/creator-payouts")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: "20", idempotencyKey: crypto.randomUUID() })
    await request(app)
      .post("/api/creator-payouts")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: "30", idempotencyKey: crypto.randomUUID() })

    const res = await request(app)
      .get("/api/creator-payouts")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })
})
