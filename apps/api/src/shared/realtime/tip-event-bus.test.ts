import { EventEmitter } from "node:events"
import { describe, expect, it, vi } from "vitest"
import { env } from "../config/env.js"
import { InMemoryTipEventBus } from "./in-memory-tip-event-bus.js"
import {
  RedisTipEventBus,
  type TipEventRedisClient,
} from "./redis-tip-event-bus.js"
import type { TipEventBus, TipEventInput } from "./tip-event.js"
import { tipEventChannel } from "./tip-event.js"
import { createTipEventBus } from "./tip-event-bus.js"

// The factory must not open a real connection when it selects the Redis
// adapter; every other test in this file uses an injected fake client.
vi.mock("ioredis", () => ({
  default: class {
    publish(): Promise<number> {
      return Promise.resolve(0)
    }
    subscribe(): Promise<number> {
      return Promise.resolve(0)
    }
    unsubscribe(): Promise<number> {
      return Promise.resolve(0)
    }
    on(): this {
      return this
    }
  },
}))

function baseEvent(streamId: string, overrides: Partial<TipEventInput> = {}): TipEventInput {
  return {
    streamId,
    tipId: "tip-1",
    creatorId: "creator-1",
    fanUserId: "fan-1",
    amount: "5",
    status: "pending",
    txHash: null,
    failureReason: null,
    ...overrides,
  }
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

async function waitFor(assertion: () => void): Promise<void> {
  await vi.waitFor(assertion, { timeout: 1000 })
}

type MessageListener = (channel: string, message: string) => void
type ConnectionListener = () => void

/** Shared broker standing in for a Redis server: all clients see each other. */
class FakeRedisBroker {
  private readonly subscriptions = new Map<string, Set<MessageListener>>()

  publish(channel: string, message: string): number {
    const listeners = this.subscriptions.get(channel)
    if (!listeners) return 0
    for (const listener of [...listeners]) listener(channel, message)
    return listeners.size
  }

  subscribe(channel: string, listener: MessageListener): void {
    let listeners = this.subscriptions.get(channel)
    if (!listeners) {
      listeners = new Set()
      this.subscriptions.set(channel, listeners)
    }
    listeners.add(listener)
  }

  unsubscribe(channel: string, listener: MessageListener): void {
    const listeners = this.subscriptions.get(channel)
    if (!listeners) return
    listeners.delete(listener)
    if (listeners.size === 0) this.subscriptions.delete(channel)
  }

  subscriptionCount(channel: string): number {
    return this.subscriptions.get(channel)?.size ?? 0
  }

  /** Redis drops pub/sub subscriptions when a connection is lost. */
  dropSubscriptions(): void {
    this.subscriptions.clear()
  }
}

class FakeRedisClient implements TipEventRedisClient {
  private readonly messageListeners = new Set<MessageListener>()
  private readonly connectionListeners = new Map<string, Set<ConnectionListener>>()

  constructor(private readonly broker: FakeRedisBroker) {}

  async publish(channel: string, message: string): Promise<number> {
    return this.broker.publish(channel, message)
  }

  async subscribe(...channels: string[]): Promise<number> {
    for (const channel of channels) {
      for (const listener of this.messageListeners) {
        this.broker.subscribe(channel, listener)
      }
    }
    return channels.length
  }

  async unsubscribe(...channels: string[]): Promise<number> {
    for (const channel of channels) {
      for (const listener of this.messageListeners) {
        this.broker.unsubscribe(channel, listener)
      }
    }
    return channels.length
  }

  on(event: "message", listener: MessageListener): this
  on(event: "error", listener: (error: Error) => void): this
  on(event: "reconnecting" | "ready" | "close" | "end", listener: ConnectionListener): this
  on(
    event: string,
    listener: MessageListener | ((error: Error) => void) | ConnectionListener
  ): this {
    if (event === "message") {
      this.messageListeners.add(listener as MessageListener)
    } else if (event !== "error") {
      const listeners = this.connectionListeners.get(event) ?? new Set<ConnectionListener>()
      listeners.add(listener as ConnectionListener)
      this.connectionListeners.set(event, listeners)
    }
    return this
  }

  emitReconnected(): void {
    this.broker.dropSubscriptions()
    for (const listener of this.connectionListeners.get("ready") ?? []) listener()
  }
}

interface AdapterPair {
  publisher: TipEventBus
  subscriber: TipEventBus
}

const adapters = [
  {
    name: "in-memory",
    createPair(): AdapterPair {
      // Two bus instances sharing one emitter model two API instances on a
      // single host; the contract below also works with isolated emitters.
      const emitter = new EventEmitter()
      return {
        publisher: new InMemoryTipEventBus(emitter),
        subscriber: new InMemoryTipEventBus(emitter),
      }
    },
  },
  {
    name: "redis",
    createPair(): AdapterPair {
      const broker = new FakeRedisBroker()
      return {
        publisher: new RedisTipEventBus(new FakeRedisClient(broker)),
        subscriber: new RedisTipEventBus(new FakeRedisClient(broker)),
      }
    },
  },
]

describe.each(adapters)("TipEventBus contract ($name)", ({ createPair }) => {
  it("delivers a published event across instances only to subscribers of that stream", async () => {
    const { publisher, subscriber } = createPair()
    const streamA = crypto.randomUUID()
    const streamB = crypto.randomUUID()
    const listenerA = vi.fn()
    const listenerB = vi.fn()
    const unsubscribeA = subscriber.subscribe(streamA, listenerA)
    const unsubscribeB = subscriber.subscribe(streamB, listenerB)

    publisher.publish(baseEvent(streamA, { tipId: "tip-a" }))

    await waitFor(() => expect(listenerA).toHaveBeenCalledTimes(1))
    expect(listenerB).not.toHaveBeenCalled()
    expect(listenerA.mock.calls[0]![0]).toMatchObject({
      streamId: streamA,
      tipId: "tip-a",
    })

    unsubscribeA()
    unsubscribeB()
  })

  it("assigns strictly increasing sequence numbers across publishes", async () => {
    const { publisher, subscriber } = createPair()
    const streamId = crypto.randomUUID()
    const sequences: number[] = []
    const unsubscribe = subscriber.subscribe(streamId, (event) => {
      sequences.push(event.seq)
    })

    publisher.publish(baseEvent(streamId, { status: "pending" }))
    publisher.publish(baseEvent(streamId, { status: "submitted" }))
    publisher.publish(baseEvent(streamId, { status: "confirmed" }))

    await waitFor(() => expect(sequences).toHaveLength(3))
    expect(sequences[1]!).toBeGreaterThan(sequences[0]!)
    expect(sequences[2]!).toBeGreaterThan(sequences[1]!)

    unsubscribe()
  })

  it("stops delivering events after unsubscribe", async () => {
    const { publisher, subscriber } = createPair()
    const streamId = crypto.randomUUID()
    const listener = vi.fn()
    const unsubscribe = subscriber.subscribe(streamId, listener)

    unsubscribe()
    await settle()
    publisher.publish(baseEvent(streamId))
    await settle()

    expect(listener).not.toHaveBeenCalled()
  })

  it("preserves the full event payload, including split payouts", async () => {
    const { publisher, subscriber } = createPair()
    const streamId = crypto.randomUUID()
    const listener = vi.fn()
    const unsubscribe = subscriber.subscribe(streamId, listener)
    const event = baseEvent(streamId, {
      status: "confirmed",
      txHash: "tx-hash",
      payouts: [
        {
          creatorId: "creator-1",
          percentage: 100,
          amount: "5",
          status: "confirmed",
          txHash: "tx-hash",
          failureReason: null,
        },
      ],
    })

    publisher.publish(event)

    await waitFor(() => expect(listener).toHaveBeenCalledTimes(1))
    expect(listener.mock.calls[0]![0]).toMatchObject(event)

    unsubscribe()
  })
})

describe("RedisTipEventBus", () => {
  it("subscribes once per channel and restores subscriptions after reconnect", async () => {
    const broker = new FakeRedisBroker()
    const client = new FakeRedisClient(broker)
    const bus = new RedisTipEventBus(client)
    const streamId = crypto.randomUUID()
    const channel = tipEventChannel(streamId)
    const first = vi.fn()
    const second = vi.fn()

    const unsubscribeFirst = bus.subscribe(streamId, first)
    const unsubscribeSecond = bus.subscribe(streamId, second)
    await settle()
    expect(broker.subscriptionCount(channel)).toBe(1)

    unsubscribeFirst()
    await settle()
    expect(broker.subscriptionCount(channel)).toBe(1)

    client.emitReconnected()
    await settle()
    expect(broker.subscriptionCount(channel)).toBe(1)

    bus.publish(baseEvent(streamId))
    await waitFor(() => expect(second).toHaveBeenCalledTimes(1))
    expect(first).not.toHaveBeenCalled()

    unsubscribeSecond()
    await settle()
    expect(broker.subscriptionCount(channel)).toBe(0)
  })

  it("ignores malformed messages without notifying listeners", async () => {
    const broker = new FakeRedisBroker()
    const bus = new RedisTipEventBus(new FakeRedisClient(broker))
    const streamId = crypto.randomUUID()
    const listener = vi.fn()
    const unsubscribe = bus.subscribe(streamId, listener)
    await settle()

    broker.publish(tipEventChannel(streamId), "not json")
    await settle()

    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })
})

describe("createTipEventBus", () => {
  it("selects the adapter from env", () => {
    const originalBus = env.TIP_EVENT_BUS
    const originalUrl = env.REDIS_URL
    try {
      env.TIP_EVENT_BUS = "memory"
      expect(createTipEventBus()).toBeInstanceOf(InMemoryTipEventBus)

      env.TIP_EVENT_BUS = "redis"
      env.REDIS_URL = "redis://localhost:6379"
      expect(createTipEventBus()).toBeInstanceOf(RedisTipEventBus)
    } finally {
      env.TIP_EVENT_BUS = originalBus
      env.REDIS_URL = originalUrl
    }
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
