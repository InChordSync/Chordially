import { describe, expect, it } from "vitest"
import { createNotificationSeed } from "../models/notification-seed.model.js"

describe("createNotificationSeed (#694)", () => {
  it("creates a valid notification seed record", () => {
    const seed = createNotificationSeed({
      recipientId: "user_123",
      actorId: "user_456",
      type: "FOLLOW",
      title: "New Follower",
      body: "user_456 started following you!",
    })

    expect(seed.id).toBeDefined()
    expect(seed.recipientId).toBe("user_123")
    expect(seed.actorId).toBe("user_456")
    expect(seed.type).toBe("FOLLOW")
    expect(seed.read).toBe(false)
    expect(typeof seed.createdAt).toBe("string")
  })
})
