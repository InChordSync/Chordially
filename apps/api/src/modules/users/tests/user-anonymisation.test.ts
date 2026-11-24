import { describe, expect, it } from "vitest"
import { prisma } from "../../../shared/database/prisma.js"
import { userAnonymisationService } from "../services/user-anonymisation.service.js"

async function seedFinancialHistory() {
  const fan = await prisma.user.create({
    data: { email: "fan-financial@example.com", passwordHash: "hash" },
  })
  const creatorUser = await prisma.user.create({
    data: { email: "creator-financial@example.com", passwordHash: "hash" },
  })
  const creator = await prisma.creatorProfile.create({
    data: { userId: creatorUser.id, displayName: "Creator", slug: "creator-financial" },
  })
  const tip = await prisma.tip.create({
    data: {
      fanUserId: fan.id,
      creatorId: creator.id,
      idempotencyKey: "anchor-1",
      amount: "1.0000000",
    },
  })
  return { fan, creatorUser, creator, tip }
}

describe("user anonymisation (financial history retention)", () => {
  it("blocks hard deletion of a user with tips", async () => {
    const { fan } = await seedFinancialHistory()

    await expect(prisma.user.delete({ where: { id: fan.id } })).rejects.toThrow()
    expect(await prisma.user.count({ where: { id: fan.id } })).toBe(1)
  })

  it("anonymises the account without erasing tip history", async () => {
    const { fan, creatorUser, creator, tip } = await seedFinancialHistory()

    await userAnonymisationService.anonymise(fan.id)
    await userAnonymisationService.anonymise(creatorUser.id)

    const anonymisedFan = await prisma.user.findUniqueOrThrow({ where: { id: fan.id } })
    expect(anonymisedFan.email).toContain(`deleted-${fan.id}@`)
    expect(anonymisedFan.passwordHash).not.toBe("hash")

    const anonymisedCreator = await prisma.creatorProfile.findUniqueOrThrow({
      where: { id: creator.id },
    })
    expect(anonymisedCreator.displayName).toBe("Deleted user")
    expect(anonymisedCreator.bio).toBeNull()

    const retainedTip = await prisma.tip.findUniqueOrThrow({ where: { id: tip.id } })
    expect(retainedTip.fanUserId).toBe(fan.id)
    expect(retainedTip.creatorId).toBe(creator.id)
  })

  it("rejects anonymising an unknown user", async () => {
    await expect(userAnonymisationService.anonymise("missing-user")).rejects.toMatchObject({
      statusCode: 404,
      code: "USER_NOT_FOUND",
    })
  })
})
