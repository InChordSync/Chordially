import { beforeEach, describe, expect, it } from "vitest"
import { DiscoveryAnalyticsTracker } from "./discovery-analytics.js"

describe("DiscoveryAnalyticsTracker (#698)", () => {
  beforeEach(() => {
    DiscoveryAnalyticsTracker.clear()
  })

  it("tracks discovery funnel conversion events", () => {
    DiscoveryAnalyticsTracker.track({
      eventName: "CREATOR_CLICK",
      surface: "web_hero",
      creatorId: "cr_999",
    })

    const events = DiscoveryAnalyticsTracker.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].eventName).toBe("CREATOR_CLICK")
    expect(events[0].surface).toBe("web_hero")
  })
})
