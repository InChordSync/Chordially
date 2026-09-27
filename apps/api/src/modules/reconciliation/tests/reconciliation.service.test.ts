import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"
import { stellarClient } from "../../../shared/stellar/client.js"
import { reconciliationService } from "../services/reconciliation.service.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password1!" })
  return { token: res.body.token as string, userId: res.body.user.id as string }
}

async function createCreatorWithWallet(email: string, slug: string) {
  const { userId } = await registerAndLogin(email)
  const creator = await prisma.creatorProfile.create({
    data: { userId, displayName: slug, slug },
  })
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } })
  return { userId, creator, wallet }
}

async function createStuckTip(options: {
  fanUserId: string
  creatorId: string
  amount: string
  streamId?: string
  ageMs: number
}) {
  const tip = await prisma.tip.create({
    data: {
      fanUserId: options.fanUserId,
      creatorId: options.creatorId,
      amount: options.amount,
      streamId: options.streamId,
      idempotencyKey: crypto.randomUUID(),
      status: "submitted",
      attempts: 1,
    },
  })
  await prisma.tip.update({
    where: { id: tip.id },
    data: { updatedAt: new Date(Date.now() - options.ageMs) },
  })
  return tip
}

beforeEach(async () => {
  await prisma.tipPayout.deleteMany()
  await prisma.tip.deleteMany()
  await prisma.streamPayoutConfig.deleteMany()
  await prisma.stream.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
  vi.mocked(stellarClient.listSentPayments).mockReset()
  vi.mocked(stellarClient.listSentPayments).mockResolvedValue([])
})

describe("reconciliationService.run", () => {
  it("ignores tips that haven't been stuck long enough yet", async () => {
    const fan = await registerAndLogin("recon-fresh-fan@test.com")
    const { creator } = await createCreatorWithWallet("recon-fresh-creator@test.com", "recon-fresh")

    await createStuckTip({
      fanUserId: fan.userId,
      creatorId: creator.id,
      amount: "10",
      ageMs: 1_000, // well under the stuck threshold
    })

    const summary = await reconciliationService.run()

    expect(summary.scanned).toBe(0)
  })

  it("confirms a stuck tip when Horizon shows the matching payment went through", async () => {
    const fan = await registerAndLogin("recon-confirm-fan@test.com")
    const { creator, wallet: creatorWallet } = await createCreatorWithWallet(
      "recon-confirm-creator@test.com",
      "recon-confirm"
    )
    const fanWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: fan.userId } })

    const tip = await createStuckTip({
      fanUserId: fan.userId,
      creatorId: creator.id,
      amount: "10",
      ageMs: 5 * 60_000,
    })

    vi.mocked(stellarClient.listSentPayments).mockResolvedValueOnce([
      {
        hash: "recovered-hash",
        from: fanWallet.publicKey,
        to: creatorWallet.publicKey,
        amount: "10.0000000",
        assetType: "native",
        successful: true,
        createdAt: new Date().toISOString(),
      },
    ])

    const summary = await reconciliationService.run()

    expect(summary.scanned).toBe(1)
    expect(summary.confirmed).toBe(1)

    const reconciled = await prisma.tip.findUniqueOrThrow({ where: { id: tip.id } })
    expect(reconciled.status).toBe("confirmed")
    expect(reconciled.txHash).toBe("recovered-hash")
  })

  it("confirms every payout of a split tip only when all payees are matched under one hash", async () => {
    const fan = await registerAndLogin("recon-split-fan@test.com")
    const { creator: host, wallet: hostWallet } = await createCreatorWithWallet(
      "recon-split-host@test.com",
      "recon-split-host"
    )
    const { creator: bob, wallet: bobWallet } = await createCreatorWithWallet(
      "recon-split-bob@test.com",
      "recon-split-bob"
    )
    const fanWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: fan.userId } })

    const tip = await createStuckTip({
      fanUserId: fan.userId,
      creatorId: host.id,
      amount: "10",
      ageMs: 5 * 60_000,
    })
    await prisma.tipPayout.createMany({
      data: [
        { tipId: tip.id, creatorId: host.id, percentage: 60, amount: "6.0000000", status: "submitted" },
        { tipId: tip.id, creatorId: bob.id, percentage: 40, amount: "4.0000000", status: "submitted" },
      ],
    })

    vi.mocked(stellarClient.listSentPayments).mockResolvedValueOnce([
      {
        hash: "split-recovered-hash",
        from: fanWallet.publicKey,
        to: hostWallet.publicKey,
        amount: "6.0000000",
        assetType: "native",
        successful: true,
        createdAt: new Date().toISOString(),
      },
      {
        hash: "split-recovered-hash",
        from: fanWallet.publicKey,
        to: bobWallet.publicKey,
        amount: "4.0000000",
        assetType: "native",
        successful: true,
        createdAt: new Date().toISOString(),
      },
    ])

    const summary = await reconciliationService.run()
    expect(summary.confirmed).toBe(1)

    const payouts = await prisma.tipPayout.findMany({ where: { tipId: tip.id } })
    expect(payouts.every((p) => p.status === "confirmed" && p.txHash === "split-recovered-hash")).toBe(
      true
    )
  })

  it("does not confirm a split tip if only some payees have a matching payment", async () => {
    const fan = await registerAndLogin("recon-partial-fan@test.com")
    const { creator: host, wallet: hostWallet } = await createCreatorWithWallet(
      "recon-partial-host@test.com",
      "recon-partial-host"
    )
    const { creator: bob } = await createCreatorWithWallet(
      "recon-partial-bob@test.com",
      "recon-partial-bob"
    )
    const fanWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: fan.userId } })

    const tip = await createStuckTip({
      fanUserId: fan.userId,
      creatorId: host.id,
      amount: "10",
      ageMs: 65_000, // stuck, but not yet past the dead-letter threshold
    })
    await prisma.tipPayout.createMany({
      data: [
        { tipId: tip.id, creatorId: host.id, percentage: 60, amount: "6.0000000", status: "submitted" },
        { tipId: tip.id, creatorId: bob.id, percentage: 40, amount: "4.0000000", status: "submitted" },
      ],
    })

    // Only the host's share shows up on-chain — the transaction as a whole
    // can't be "half confirmed", so this must not be treated as a match.
    vi.mocked(stellarClient.listSentPayments).mockResolvedValueOnce([
      {
        hash: "partial-hash",
        from: fanWallet.publicKey,
        to: hostWallet.publicKey,
        amount: "6.0000000",
        assetType: "native",
        successful: true,
        createdAt: new Date().toISOString(),
      },
    ])

    const summary = await reconciliationService.run()

    expect(summary.confirmed).toBe(0)
    expect(summary.stillPending).toBe(1)

    const reconciled = await prisma.tip.findUniqueOrThrow({ where: { id: tip.id } })
    expect(reconciled.status).toBe("submitted")
  })

  it("dead-letters a stuck tip with no matching ledger transaction after the dead-letter threshold", async () => {
    const fan = await registerAndLogin("recon-deadletter-fan@test.com")
    const { creator } = await createCreatorWithWallet(
      "recon-deadletter-creator@test.com",
      "recon-deadletter"
    )

    const tip = await createStuckTip({
      fanUserId: fan.userId,
      creatorId: creator.id,
      amount: "10",
      ageMs: 6 * 60_000, // past the default 5-minute dead-letter threshold
    })

    const summary = await reconciliationService.run()

    expect(summary.deadLettered).toBe(1)

    const reconciled = await prisma.tip.findUniqueOrThrow({ where: { id: tip.id } })
    expect(reconciled.status).toBe("failed")
    expect(reconciled.failureReason).toContain("reconciliation")
  })

  it("does not confirm a native tip using a same-amount USDC payment to the same destination", async () => {
    const fan = await registerAndLogin("recon-asset-fan@test.com")
    const { creator, wallet: creatorWallet } = await createCreatorWithWallet(
      "recon-asset-creator@test.com",
      "recon-asset"
    )
    const fanWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: fan.userId } })

    const tip = await createStuckTip({
      fanUserId: fan.userId,
      creatorId: creator.id,
      amount: "10",
      ageMs: 65_000, // stuck, but not yet past the dead-letter threshold
    })

    // Same destination, same numeric amount, but a USDC payment — must not
    // be mistaken for the native-XLM tip's confirmation.
    vi.mocked(stellarClient.listSentPayments).mockResolvedValueOnce([
      {
        hash: "wrong-asset-hash",
        from: fanWallet.publicKey,
        to: creatorWallet.publicKey,
        amount: "10.0000000",
        assetType: "credit_alphanum4",
        assetCode: "USDC",
        assetIssuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        successful: true,
        createdAt: new Date().toISOString(),
      },
    ])

    const summary = await reconciliationService.run()

    expect(summary.confirmed).toBe(0)
    expect(summary.stillPending).toBe(1)

    const reconciled = await prisma.tip.findUniqueOrThrow({ where: { id: tip.id } })
    expect(reconciled.status).toBe("submitted")
  })

  it("leaves a stuck tip pending when not yet past the dead-letter threshold and nothing matches", async () => {
    const fan = await registerAndLogin("recon-pending-fan@test.com")
    const { creator } = await createCreatorWithWallet("recon-pending-creator@test.com", "recon-pending")

    await createStuckTip({
      fanUserId: fan.userId,
      creatorId: creator.id,
      amount: "10",
      ageMs: 65_000,
    })

    const summary = await reconciliationService.run()

    expect(summary.stillPending).toBe(1)
    expect(summary.confirmed).toBe(0)
    expect(summary.deadLettered).toBe(0)
  })
})
