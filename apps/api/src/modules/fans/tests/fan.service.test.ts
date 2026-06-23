import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../../../shared/database/prisma.js"
import { fanService } from "../services/fan.service.js"

async function createUser(email: string) {
  return prisma.user.create({
    data: { email, passwordHash: "hash" },
  })
}

beforeEach(async () => {
  await prisma.fanProfile.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

afterEach(async () => {
  await prisma.fanProfile.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

describe("fanService.createFanProfile", () => {
  it("creates a fan profile with empty genrePrefs by default", async () => {
    const user = await createUser("fan@test.com")
    const profile = await fanService.createFanProfile({
      userId: user.id,
      displayName: "Cool Fan",
    })

    expect(profile.userId).toBe(user.id)
    expect(profile.displayName).toBe("Cool Fan")
    expect(profile.genrePrefs).toEqual([])
    expect(profile.avatarUrl).toBeNull()
  })

  it("returns the existing profile if one already exists (idempotent)", async () => {
    const user = await createUser("duplicate@test.com")
    const first = await fanService.createFanProfile({ userId: user.id, displayName: "Fan" })
    const second = await fanService.createFanProfile({ userId: user.id, displayName: "Fan Again" })

    expect(second.id).toBe(first.id)
    expect(second.displayName).toBe("Fan")
  })
})

describe("fanService.updateFanProfile", () => {
  it("allows the owner to update their profile", async () => {
    const user = await createUser("owner@test.com")
    const profile = await fanService.createFanProfile({
      userId: user.id,
      displayName: "Original",
    })

    const updated = await fanService.updateFanProfile(
      profile.id,
      { displayName: "Updated" },
      user.id
    )

    expect(updated.displayName).toBe("Updated")
  })

  it("throws 403 if a different user tries to update the profile", async () => {
    const user = await createUser("owner2@test.com")
    const other = await createUser("other@test.com")
    const profile = await fanService.createFanProfile({
      userId: user.id,
      displayName: "Fan",
    })

    await expect(
      fanService.updateFanProfile(profile.id, { displayName: "Hacked" }, other.id)
    ).rejects.toMatchObject({ statusCode: 403, code: "FORBIDDEN" })
  })

  it("throws 404 for a nonexistent profile", async () => {
    const user = await createUser("nobody@test.com")
    await expect(
      fanService.updateFanProfile("nonexistent-id", { displayName: "X" }, user.id)
    ).rejects.toMatchObject({ statusCode: 404, code: "FAN_NOT_FOUND" })
  })
})

describe("fanService.updateGenrePrefs", () => {
  it("allows the owner to update genre preferences", async () => {
    const user = await createUser("genrefan@test.com")
    const profile = await fanService.createFanProfile({
      userId: user.id,
      displayName: "Genre Fan",
    })

    const updated = await fanService.updateGenrePrefs(
      profile.id,
      ["jazz", "indie", "lo-fi"],
      user.id
    )

    expect(updated.genrePrefs).toEqual(["jazz", "indie", "lo-fi"])
  })

  it("throws 403 if a different user tries to update genre prefs", async () => {
    const user = await createUser("genreowner@test.com")
    const other = await createUser("genreother@test.com")
    const profile = await fanService.createFanProfile({
      userId: user.id,
      displayName: "Fan",
    })

    await expect(
      fanService.updateGenrePrefs(profile.id, ["pop"], other.id)
    ).rejects.toMatchObject({ statusCode: 403, code: "FORBIDDEN" })
  })

  it("throws 404 for a nonexistent profile", async () => {
    const user = await createUser("genrenobody@test.com")
    await expect(
      fanService.updateGenrePrefs("nonexistent-id", ["rock"], user.id)
    ).rejects.toMatchObject({ statusCode: 404, code: "FAN_NOT_FOUND" })
  })
})

describe("fanService.findByUserId", () => {
  it("returns null for a user with no fan profile", async () => {
    const user = await createUser("noprofile@test.com")
    const result = await fanService.findByUserId(user.id)
    expect(result).toBeNull()
  })

  it("returns the profile for a user that has one", async () => {
    const user = await createUser("hasfan@test.com")
    await fanService.createFanProfile({ userId: user.id, displayName: "Fan" })
    const result = await fanService.findByUserId(user.id)
    expect(result).not.toBeNull()
    expect(result?.userId).toBe(user.id)
  })
})
