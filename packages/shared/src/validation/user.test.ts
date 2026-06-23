import { describe, expect, it } from "vitest"
import { updateMeSchema } from "./user.js"

describe("updateMeSchema", () => {
  it("accepts an empty object — all fields are optional", () => {
    expect(updateMeSchema.safeParse({}).success).toBe(true)
  })

  it("accepts a fully populated valid object", () => {
    const result = updateMeSchema.safeParse({
      displayName: "Jordan Rivers",
      bio: "Indie artist from Lagos.",
      avatarUrl: "https://cdn.example.com/avatar.jpg",
      genre: "Afrobeats",
      location: "Lagos, Nigeria",
      genrePrefs: ["afrobeats", "jazz"],
    })
    expect(result.success).toBe(true)
  })

  it("rejects displayName shorter than 2 characters", () => {
    const result = updateMeSchema.safeParse({ displayName: "A" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toMatch(/at least 2/i)
  })

  it("rejects displayName longer than 50 characters", () => {
    const result = updateMeSchema.safeParse({ displayName: "A".repeat(51) })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toMatch(/at most 50/i)
  })

  it("accepts bio as null — nullable clears the field", () => {
    const result = updateMeSchema.safeParse({ bio: null })
    expect(result.success).toBe(true)
  })

  it("rejects bio longer than 300 characters", () => {
    const result = updateMeSchema.safeParse({ bio: "x".repeat(301) })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toMatch(/at most 300/i)
  })

  it("accepts avatarUrl as null — nullable clears the field", () => {
    const result = updateMeSchema.safeParse({ avatarUrl: null })
    expect(result.success).toBe(true)
  })

  it("rejects avatarUrl that is not a valid URL", () => {
    const result = updateMeSchema.safeParse({ avatarUrl: "not-a-url" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toMatch(/valid url/i)
  })

  it("accepts avatarUrl as a valid https URL", () => {
    const result = updateMeSchema.safeParse({
      avatarUrl: "https://cdn.example.com/avatar.webp",
    })
    expect(result.success).toBe(true)
  })

  it("rejects genrePrefs with more than 10 items", () => {
    const result = updateMeSchema.safeParse({
      genrePrefs: Array(11).fill("jazz"),
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toMatch(/at most 10/i)
  })

  it("rejects a genrePrefs item longer than 30 characters", () => {
    const result = updateMeSchema.safeParse({
      genrePrefs: ["x".repeat(31)],
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toMatch(/at most 30/i)
  })

  it("accepts genrePrefs with exactly 10 valid items", () => {
    const result = updateMeSchema.safeParse({
      genrePrefs: Array(10).fill("jazz"),
    })
    expect(result.success).toBe(true)
  })
})
