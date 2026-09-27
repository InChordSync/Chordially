import { describe, expect, it } from "vitest"
import {
  rankTrending,
  type TrendingSignal,
} from "../services/trending-creators.service.js"

function signal(creatorId: string, overrides: Partial<TrendingSignal> = {}): TrendingSignal {
  return {
    creatorId,
    followerCount: 0,
    newFollowers7d: 0,
    streamCount7d: 0,
    ...overrides,
  }
}

describe("rankTrending", () => {
  it("returns an empty array for no signals", () => {
    expect(rankTrending([])).toEqual([])
  })

  it("ranks higher-activity creators first", () => {
    const signals = [
      signal("low", { newFollowers7d: 1 }),
      signal("high", { newFollowers7d: 5, streamCount7d: 3 }),
      signal("mid", { streamCount7d: 2 }),
    ]

    const ranked = rankTrending(signals)
    expect(ranked.map((s) => s.creatorId)).toEqual(["high", "mid", "low"])
  })

  it("applies the limit", () => {
    const signals = [
      signal("a", { newFollowers7d: 5 }),
      signal("b", { newFollowers7d: 3 }),
      signal("c", { newFollowers7d: 1 }),
    ]

    expect(rankTrending(signals, 2)).toHaveLength(2)
  })

  it("does not mutate the input array", () => {
    const signals = [signal("a", { newFollowers7d: 1 }), signal("b", { newFollowers7d: 3 })]
    rankTrending(signals)
    expect(signals[0].creatorId).toBe("a")
  })
})
