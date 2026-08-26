import { Keypair } from "@chordially/stellar"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"
import { anchorClient } from "../../../shared/anchor/client.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password1!" })
  return { token: res.body.token as string, userId: res.body.user.id as string }
}

async function registerLinkedAndLogin(email: string) {
  const external = Keypair.random()
  const challengeRes = await request(app).get(
    `/api/wallet/link-challenge?publicKey=${external.publicKey()}`
  )
  const { challenge, nonce } = challengeRes.body as { challenge: string; nonce: string }
  const signature = external.sign(Buffer.from(nonce, "utf8")).toString("base64")

  const res = await request(app)
    .post("/api/auth/register-linked")
    .send({ email, password: "Password1!", publicKey: external.publicKey(), challenge, signature })

  return { token: res.body.token as string, userId: res.body.user.id as string }
}

beforeEach(() => {
  vi.mocked(anchorClient.requestChallenge).mockClear()
  vi.mocked(anchorClient.submitChallenge).mockClear()
  vi.mocked(anchorClient.startInteractiveDeposit).mockClear()
  vi.mocked(anchorClient.fetchTransaction).mockReset()
  vi.mocked(anchorClient.fetchTransaction).mockResolvedValue({ status: "incomplete" })
})

describe("POST /api/wallet/deposits", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/wallet/deposits").send({})
    expect(res.status).toBe(401)
  })

  it("authenticates with the anchor and starts an interactive deposit", async () => {
    const { token } = await registerAndLogin("deposit-happy@test.com")

    const res = await request(app)
      .post("/api/wallet/deposits")
      .set("Authorization", `Bearer ${token}`)
      .send({ assetCode: "USDC" })

    expect(res.status).toBe(201)
    expect(res.body.assetCode).toBe("USDC")
    expect(res.body.status).toBe("incomplete")
    expect(typeof res.body.interactiveUrl).toBe("string")

    expect(anchorClient.requestChallenge).toHaveBeenCalledTimes(1)
    expect(anchorClient.submitChallenge).toHaveBeenCalledTimes(1)
    expect(anchorClient.startInteractiveDeposit).toHaveBeenCalledWith(
      expect.objectContaining({ assetCode: "USDC" })
    )
  })

  it("defaults to native XLM when no assetCode is given", async () => {
    const { token } = await registerAndLogin("deposit-default@test.com")

    const res = await request(app)
      .post("/api/wallet/deposits")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(201)
    expect(res.body.assetCode).toBe("native")
  })

  it("fails with a distinct error when anchor authentication fails", async () => {
    const { token } = await registerAndLogin("deposit-auth-fail@test.com")
    vi.mocked(anchorClient.requestChallenge).mockRejectedValueOnce(new Error("anchor down"))

    const res = await request(app)
      .post("/api/wallet/deposits")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(502)
    expect(res.body.error.code).toBe("ANCHOR_AUTH_FAILED")
  })

  it("rejects a deposit from a linked (non-custodial) wallet with a clear error", async () => {
    const { token } = await registerLinkedAndLogin("deposit-linked@test.com")

    const res = await request(app)
      .post("/api/wallet/deposits")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe("WALLET_NOT_CUSTODIAL")
    expect(anchorClient.requestChallenge).not.toHaveBeenCalled()
  })
})

describe("GET /api/wallet/deposits and /api/wallet/deposits/:id", () => {
  it("lists a user's own deposits, most recent first", async () => {
    const { token } = await registerAndLogin("deposit-list@test.com")

    await request(app).post("/api/wallet/deposits").set("Authorization", `Bearer ${token}`).send({})
    await request(app)
      .post("/api/wallet/deposits")
      .set("Authorization", `Bearer ${token}`)
      .send({ assetCode: "USDC" })

    const res = await request(app)
      .get("/api/wallet/deposits")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].assetCode).toBe("USDC")
  })

  it("refreshes and returns a deposit's current status from the anchor", async () => {
    const { token } = await registerAndLogin("deposit-refresh@test.com")

    const created = await request(app)
      .post("/api/wallet/deposits")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    vi.mocked(anchorClient.fetchTransaction).mockResolvedValueOnce({
      status: "completed",
      amountIn: "50.0000000",
    })

    const res = await request(app)
      .get(`/api/wallet/deposits/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("completed")
    expect(res.body.amountIn).toBe("50.0000000")

    const stored = await prisma.walletDeposit.findUniqueOrThrow({ where: { id: created.body.id } })
    expect(stored.status).toBe("completed")
  })

  it("does not re-poll the anchor once a deposit has reached a terminal status", async () => {
    const { token } = await registerAndLogin("deposit-terminal@test.com")

    const created = await request(app)
      .post("/api/wallet/deposits")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    await prisma.walletDeposit.update({
      where: { id: created.body.id },
      data: { status: "completed", amountIn: "10.0000000" },
    })

    vi.mocked(anchorClient.fetchTransaction).mockClear()

    const res = await request(app)
      .get(`/api/wallet/deposits/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("completed")
    expect(anchorClient.fetchTransaction).not.toHaveBeenCalled()
  })

  it("distinguishes an anchor-reported error from a successful deposit", async () => {
    const { token } = await registerAndLogin("deposit-error@test.com")

    const created = await request(app)
      .post("/api/wallet/deposits")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    vi.mocked(anchorClient.fetchTransaction).mockResolvedValueOnce({
      status: "error",
      message: "KYC verification failed",
    })

    const res = await request(app)
      .get(`/api/wallet/deposits/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("error")
    expect(res.body.failureReason).toBe("KYC verification failed")
  })

  it("returns 404 for a deposit that isn't the caller's", async () => {
    const owner = await registerAndLogin("deposit-owner@test.com")
    const other = await registerAndLogin("deposit-other@test.com")

    const created = await request(app)
      .post("/api/wallet/deposits")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({})

    const res = await request(app)
      .get(`/api/wallet/deposits/${created.body.id}`)
      .set("Authorization", `Bearer ${other.token}`)

    expect(res.status).toBe(404)
  })
})
