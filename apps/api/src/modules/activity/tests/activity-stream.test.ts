import { beforeEach, describe, expect, it } from "vitest"
import { ActivityStreamService } from "../services/activity-stream.service.js"

describe("ActivityStreamService (#695)", () => {
  beforeEach(() => {
    ActivityStreamService.clear()
  })

  it("records and retrieves activity items for creators", () => {
    ActivityStreamService.addActivity({
      id: "act_1",
      creatorId: "creator_123",
      type: "POST_CREATED",
      title: "New Track Released!",
      summary: "Check out my new acoustic single.",
      createdAt: new Date().toISOString(),
    })

    const activities = ActivityStreamService.getActivities("creator_123")
    expect(activities).toHaveLength(1)
    expect(activities[0].title).toBe("New Track Released!")
  })
})
