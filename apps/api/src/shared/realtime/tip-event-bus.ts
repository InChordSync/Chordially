import RedisDefault from "ioredis"
import { env } from "../config/env.js"
import { InMemoryTipEventBus } from "./in-memory-tip-event-bus.js"
import { RedisTipEventBus } from "./redis-tip-event-bus.js"
import type { TipEventBus } from "./tip-event.js"

export type {
  TipEventBus,
  TipEventInput,
  TipEventListener,
  TipFeedEvent,
} from "./tip-event.js"
export { InMemoryTipEventBus } from "./in-memory-tip-event-bus.js"
export { RedisTipEventBus } from "./redis-tip-event-bus.js"

// With NodeNext, ioredis' CommonJS typings surface the default import as a
// module namespace, while at runtime it is the Redis constructor.
const Redis = RedisDefault as unknown as typeof import("ioredis").Redis

/** Selects the bus from config; the Redis client is only created when selected. */
export function createTipEventBus(): TipEventBus {
  if (env.TIP_EVENT_BUS === "redis") {
    // env.ts already enforces this; keep the guard for direct factory calls.
    if (!env.REDIS_URL) {
      throw new Error("REDIS_URL is required when TIP_EVENT_BUS=redis")
    }
    return new RedisTipEventBus(new Redis(env.REDIS_URL))
  }

  return new InMemoryTipEventBus()
}

/** Stable singleton so existing publishers/subscribers need no changes. */
export const tipEventBus: TipEventBus = createTipEventBus()
