import { describe, expect, it } from "vitest"
import {
  computeCreatorCompleteness,
  computeCreatorOnboardingProgress,
  computeFanCompleteness,
  creatorFieldLabels,
  creatorOnboardingRules,
  fanFieldLabels,
} from "./profile-completeness.js"

const baseCreator = {
  id: "cp-1",
  userId: "u-1",
  displayName: "",
  slug: "test",
  bio: null,
  avatarUrl: null,
  genre: null,
  location: null,
  isVerified: false,
  followerCount: 0,
  trackCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

const baseFan = {
  id: "fp-1",
  userId: "u-1",
  displayName: "",
  avatarUrl: null,
  genrePrefs: [] as string[],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

describe("computeCreatorCompleteness", () => {
  it("returns 0 with all missing fields when all fields are empty", () => {
    const result = computeCreatorCompleteness(baseCreator)
    expect(result.score).toBe(0)
    expect(result.missingFields).toEqual([
      "displayName",
      "bio",
      "avatarUrl",
      "genre",
      "location",
    ])
  })

  it("returns 100 with no missing fields when all fields are filled", () => {
    const result = computeCreatorCompleteness({
      ...baseCreator,
      displayName: "Solar Vibes",
      bio: "Indie producer",
      avatarUrl: "https://example.com/avatar.jpg",
      genre: "Indie",
      location: "Lagos",
    })
    expect(result.score).toBe(100)
    expect(result.missingFields).toEqual([])
  })

  it("weights bio (30) higher than location (10)", () => {
    const withBio = computeCreatorCompleteness({
      ...baseCreator,
      bio: "Has a bio",
    })
    const withLocation = computeCreatorCompleteness({
      ...baseCreator,
      location: "Lagos",
    })
    expect(withBio.score).toBeGreaterThan(withLocation.score)
    expect(withBio.score).toBe(30)
    expect(withLocation.score).toBe(10)
  })

  it("returns correct missingFields for partially filled profile", () => {
    const result = computeCreatorCompleteness({
      ...baseCreator,
      displayName: "Solar Vibes",
      avatarUrl: "https://example.com/avatar.jpg",
    })
    expect(result.score).toBe(45)
    expect(result.missingFields).toEqual(["bio", "genre", "location"])
  })
})

describe("creatorFieldLabels", () => {
  it("has a label for every field returned in missingFields", () => {
    const result = computeCreatorCompleteness(baseCreator)
    for (const key of result.missingFields) {
      expect(creatorFieldLabels[key]).toBeDefined()
    }
  })

  it("maps avatarUrl to a human-readable label", () => {
    expect(creatorFieldLabels["avatarUrl"]).toBe("Profile photo")
  })
})

describe("fanFieldLabels", () => {
  it("has a label for every field returned in missingFields", () => {
    const result = computeFanCompleteness(baseFan)
    for (const key of result.missingFields) {
      expect(fanFieldLabels[key]).toBeDefined()
    }
  })
})

describe("computeFanCompleteness", () => {
  it("returns 0 with all missing fields when all fields are empty", () => {
    const result = computeFanCompleteness(baseFan)
    expect(result.score).toBe(0)
    expect(result.missingFields).toEqual([
      "displayName",
      "avatarUrl",
      "genrePrefs",
    ])
  })

  it("returns 100 with no missing fields when all fields are filled", () => {
    const result = computeFanCompleteness({
      ...baseFan,
      displayName: "Cool Fan",
      avatarUrl: "https://example.com/avatar.jpg",
      genrePrefs: ["jazz", "indie"],
    })
    expect(result.score).toBe(100)
    expect(result.missingFields).toEqual([])
  })

  it("weights avatarUrl (40) highest for fan profiles", () => {
    const withAvatar = computeFanCompleteness({
      ...baseFan,
      avatarUrl: "https://example.com/avatar.jpg",
    })
    const withName = computeFanCompleteness({
      ...baseFan,
      displayName: "Cool Fan",
    })
    expect(withAvatar.score).toBe(40)
    expect(withName.score).toBe(30)
    expect(withAvatar.score).toBeGreaterThan(withName.score)
  })

  it("counts genrePrefs as filled only when non-empty", () => {
    const result = computeFanCompleteness({
      ...baseFan,
      displayName: "Cool Fan",
      genrePrefs: [],
    })
    expect(result.score).toBe(30)
    expect(result.missingFields).toContain("genrePrefs")
  })
})

describe("creatorOnboardingRules", () => {
  it("defines rules for every field in the creator completeness check", () => {
    const fieldKeys = ["displayName", "bio", "avatarUrl", "genre", "location"]
    const ruleFields = creatorOnboardingRules.flatMap((r) => r.fields)
    for (const key of fieldKeys) {
      expect(ruleFields).toContain(key)
    }
  })
})

describe("computeCreatorOnboardingProgress", () => {
  it("returns 0% and 0 completed when no fields are filled", () => {
    const result = computeCreatorOnboardingProgress(baseCreator)
    expect(result.completedRules).toBe(0)
    expect(result.totalRules).toBe(4)
    expect(result.progressPercent).toBe(0)
    expect(result.score).toBe(0)
  })

  it("returns 100% and all rules completed when all fields are filled", () => {
    const result = computeCreatorOnboardingProgress({
      ...baseCreator,
      displayName: "Solar Vibes",
      bio: "Indie producer",
      avatarUrl: "https://example.com/avatar.jpg",
      genre: "Indie",
      location: "Lagos",
    })
    expect(result.completedRules).toBe(4)
    expect(result.progressPercent).toBe(100)
  })

  it("marks individual rules as completed based on their required fields", () => {
    const result = computeCreatorOnboardingProgress({
      ...baseCreator,
      displayName: "Solar Vibes",
      avatarUrl: "https://example.com/avatar.jpg",
      genre: "Indie",
    })
    const basicInfo = result.rules.find((r) => r.key === "basic_info")
    const bioRule = result.rules.find((r) => r.key === "bio")
    const genreRule = result.rules.find((r) => r.key === "genre")
    expect(basicInfo!.completed).toBe(true)
    expect(bioRule!.completed).toBe(false)
    expect(genreRule!.completed).toBe(true)
    expect(result.completedRules).toBe(2)
    expect(result.progressPercent).toBe(50)
  })
})
