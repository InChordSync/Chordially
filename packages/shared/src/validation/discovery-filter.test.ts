import { describe, expect, it } from "vitest"
import { discoveryFilterSchema } from "./discovery-filter.schemas.js"

describe("discoveryFilterSchema (#692)", () => {
  it("parses valid input with defaults", () => {
    const parsed = discoveryFilterSchema.parse({})
    expect(parsed.genre).toBe("all")
    expect(parsed.page).toBe(1)
    expect(parsed.sortBy).toBe("freshness")
  })

  it("validates custom parameters", () => {
    const parsed = discoveryFilterSchema.parse({
      query: "rock",
      genre: "Indie",
      isLiveOnly: true,
      minFollowers: 100,
      sortBy: "followers",
    })
    expect(parsed.query).toBe("rock")
    expect(parsed.genre).toBe("Indie")
    expect(parsed.isLiveOnly).toBe(true)
    expect(parsed.minFollowers).toBe(100)
    expect(parsed.sortBy).toBe("followers")
  })
})
