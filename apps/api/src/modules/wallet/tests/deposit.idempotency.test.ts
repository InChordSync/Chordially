import { describe, expect, it } from "vitest"
import { prisma } from "../../../shared/database/prisma.js"
import { depositRepository } from "../repositories/deposit.repository.js"

async function seedUser() {
  return prisma.user.create({
    data: { email: "deposit-idempotency@example.com", passwordHash: "hash" },
  })
}

function depositInput(userId: string) {
  return {
    userId,
    assetCode: "USDC",
    anchorTransactionId: "anchor-tx-123",
    interactiveUrl: "https://anchor.example.com/interactive/anchor-tx-123",
  }
}

describe("WalletDeposit anchorTransactionId idempotency", () => {
  it("returns the existing row when a webhook is delivered twice", async () => {
    const user = await seedUser()
    const input = depositInput(user.id)

    const first = await depositRepository.findOrCreateByAnchorTransactionId(input)
    const second = await depositRepository.findOrCreateByAnchorTransactionId(input)

    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    expect(second.deposit.id).toBe(first.deposit.id)
    expect(await prisma.walletDeposit.count({ where: { anchorTransactionId: input.anchorTransactionId } })).toBe(1)
  })

  it("collapses concurrent duplicate deliveries into one row", async () => {
    const user = await seedUser()
    const input = { ...depositInput(user.id), anchorTransactionId: "anchor-tx-concurrent" }

    const results = await Promise.all([
      depositRepository.findOrCreateByAnchorTransactionId(input),
      depositRepository.findOrCreateByAnchorTransactionId(input),
      depositRepository.findOrCreateByAnchorTransactionId(input),
    ])

    expect(results.filter((result) => result.created)).toHaveLength(1)
    expect(new Set(results.map((result) => result.deposit.id)).size).toBe(1)
    expect(await prisma.walletDeposit.count({ where: { anchorTransactionId: input.anchorTransactionId } })).toBe(1)
  })

  it("rejects two different deposits with the same anchor id at the database level", async () => {
    const user = await seedUser()
    const input = depositInput(user.id)
    await prisma.walletDeposit.create({ data: input })

    await expect(
      prisma.walletDeposit.create({
        data: { ...input, interactiveUrl: "https://anchor.example.com/other" },
      })
    ).rejects.toMatchObject({ code: "P2002" })
  })
})
