import { describe, expect, it } from "vitest"
import { RewardEntitlementService } from "../services/reward-entitlement.service.js"

describe("RewardEntitlementService", () => {
  const service = new RewardEntitlementService()

  it("returns an entitlement for support at or above the threshold", () => {
    const result = service.evaluateFanThreshold("fan_1", "creator_1", 5000)

    expect(result).not.toBeNull()
    expect(result?.fanId).toBe("fan_1")
    expect(result?.creatorId).toBe("creator_1")
    expect(result?.unlockedTier.tierId).toBe("tier_gold")
  })

  it("returns an entitlement for support above the threshold", () => {
    const result = service.evaluateFanThreshold("fan_1", "creator_1", 12_000)
    expect(result).not.toBeNull()
  })

  it("returns null for support below the threshold", () => {
    const result = service.evaluateFanThreshold("fan_1", "creator_1", 4999)
    expect(result).toBeNull()
  })

  it("handles zero support without an entitlement", () => {
    const result = service.evaluateFanThreshold("fan_1", "creator_1", 0)
    expect(result).toBeNull()
  })
})
