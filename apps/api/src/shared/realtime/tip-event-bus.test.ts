import { describe, expect, it, vi } from "vitest"
import { tipEventBus } from "./tip-event-bus.js"

function baseEvent(streamId: string, overrides: Partial<Parameters<typeof tipEventBus.publish>[0]> = {}) {
  return {
    streamId,
    tipId: "tip-1",
    creatorId: "creator-1",
    fanUserId: "fan-1",
    amount: "5",
    status: "pending" as const,
    txHash: null,
    failureReason: null,
    ...overrides,
  }
}

describe("tipEventBus", () => {
  it("delivers a published event only to subscribers of that stream", () => {
    const streamA = crypto.randomUUID()
    const streamB = crypto.randomUUID()
    const listenerA = vi.fn()
    const listenerB = vi.fn()

    const unsubA = tipEventBus.subscribe(streamA, listenerA)
    const unsubB = tipEventBus.subscribe(streamB, listenerB)

    tipEventBus.publish(baseEvent(streamA))

    expect(listenerA).toHaveBeenCalledTimes(1)
    expect(listenerB).not.toHaveBeenCalled()

    unsubA()
    unsubB()
  })

  it("assigns strictly increasing sequence numbers across publishes", () => {
    const streamId = crypto.randomUUID()
    const events: number[] = []
    const unsubscribe = tipEventBus.subscribe(streamId, (event) => events.push(event.seq))

    tipEventBus.publish(baseEvent(streamId))
    tipEventBus.publish(baseEvent(streamId, { status: "submitted" }))
    tipEventBus.publish(baseEvent(streamId, { status: "confirmed" }))

    expect(events).toHaveLength(3)
    expect(events[1]).toBeGreaterThan(events[0]!)
    expect(events[2]).toBeGreaterThan(events[1]!)

    unsubscribe()
  })

  it("stops delivering events after unsubscribe", () => {
    const streamId = crypto.randomUUID()
    const listener = vi.fn()
    const unsubscribe = tipEventBus.subscribe(streamId, listener)

    unsubscribe()
    tipEventBus.publish(baseEvent(streamId))

    expect(listener).not.toHaveBeenCalled()
  })

  it("drops all subscribers when closed on shutdown", () => {
    const streamId = crypto.randomUUID()
    const listener = vi.fn()
    tipEventBus.subscribe(streamId, listener)

    tipEventBus.close()
    tipEventBus.publish(baseEvent(streamId))

    expect(listener).not.toHaveBeenCalled()
  })
})
