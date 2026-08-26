import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"
import { stellarClient } from "../../../shared/stellar/client.js"
import { walletService } from "../../wallet/services/wallet.service.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password1!" })
  return { token: res.body.token as string, userId: res.body.user.id as string }
}

async function createCreatorWithWallet(email: string, slug: string) {
  const user = await prisma.user.create({ data: { email, passwordHash: "hash" } })
  const creator = await prisma.creatorProfile.create({
    data: { userId: user.id, displayName: slug, slug },
  })
  await walletService.createWalletForUser(user.id)
  return creator
}

beforeEach(async () => {
  await prisma.tip.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
  vi.mocked(stellarClient.submitPayment).mockClear()
})

describe("POST /api/tips with asset: USDC", () => {
  it("fails fast when the fan has no USDC trustline yet", async () => {
    const { token, userId } = await registerAndLogin("fan-no-usdc@test.com")
    const creator = await createCreatorWithWallet("creator-usdc-a@test.com", "usdc-creator-a")

    const res = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "5", asset: "USDC", idempotencyKey: crypto.randomUUID() })

    expect(res.status).toBe(201)
    expect(res.body.status).toBe("failed")
    expect(res.body.failureReason).toContain("USDC")
    expect(vi.mocked(stellarClient.submitPayment)).not.toHaveBeenCalled()

    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    expect(wallet?.usdcTrustline).toBe(false)
  })

  it("fails fast when the creator has no USDC trustline yet", async () => {
    const { token, userId: fanUserId } = await registerAndLogin("fan-usdc-ready@test.com")
    await walletService.establishUsdcTrustline(fanUserId)
    const creator = await createCreatorWithWallet("creator-usdc-b@test.com", "usdc-creator-b")

    const res = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "5", asset: "USDC", idempotencyKey: crypto.randomUUID() })

    expect(res.status).toBe(201)
    expect(res.body.status).toBe("failed")
    expect(res.body.failureReason).toContain("Creator has not set up USDC")
  })

  it("submits a USDC-denominated payment once both sides have a trustline", async () => {
    const { token, userId: fanUserId } = await registerAndLogin("fan-usdc-full@test.com")
    await walletService.establishUsdcTrustline(fanUserId)

    const creator = await createCreatorWithWallet("creator-usdc-c@test.com", "usdc-creator-c")
    await walletService.establishUsdcTrustline(
      (await prisma.creatorProfile.findUniqueOrThrow({ where: { id: creator.id } })).userId
    )

    const res = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "5", asset: "USDC", idempotencyKey: crypto.randomUUID() })

    expect(res.status).toBe(201)
    expect(res.body.status).toBe("confirmed")
    expect(res.body.asset).toBe("USDC")

    expect(vi.mocked(stellarClient.submitPayment)).toHaveBeenCalledWith(
      expect.objectContaining({ asset: { code: "USDC", issuer: expect.any(String) } })
    )
  })

  it("defaults to native XLM when no asset is specified", async () => {
    const { token } = await registerAndLogin("fan-native-default@test.com")
    const creator = await createCreatorWithWallet("creator-native-default@test.com", "native-default")

    const res = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "5", idempotencyKey: crypto.randomUUID() })

    expect(res.status).toBe(201)
    expect(res.body.asset).toBe("native")
  })
})

describe("POST /api/wallet/usdc-trustline", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/wallet/usdc-trustline")
    expect(res.status).toBe(401)
  })

  it("establishes a trustline and is idempotent on a second call", async () => {
    const { token, userId } = await registerAndLogin("trustline-user@test.com")

    const first = await request(app)
      .post("/api/wallet/usdc-trustline")
      .set("Authorization", `Bearer ${token}`)
    expect(first.status).toBe(200)
    expect(first.body.usdcTrustline).toBe(true)

    vi.mocked(stellarClient.establishTrustline).mockClear()

    const second = await request(app)
      .post("/api/wallet/usdc-trustline")
      .set("Authorization", `Bearer ${token}`)
    expect(second.status).toBe(200)
    expect(second.body.usdcTrustline).toBe(true)
    expect(vi.mocked(stellarClient.establishTrustline)).not.toHaveBeenCalled()

    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    expect(wallet?.usdcTrustline).toBe(true)
  })
})
