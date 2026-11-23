import { logger } from "../logger/logger.js"
import {
  tipEventChannel,
  toTipFeedEvent,
  type TipEventBus,
  type TipEventInput,
  type TipEventListener,
  type TipFeedEvent,
} from "./tip-event.js"

type MessageListener = (channel: string, message: string) => void
type ErrorListener = (error: Error) => void
type ConnectionListener = () => void

/** The subset of ioredis used here, kept structural so tests can fake it. */
export interface TipEventRedisClient {
  publish(channel: string, message: string): Promise<unknown>
  subscribe(channel: string): Promise<unknown>
  unsubscribe(channel: string): Promise<unknown>
  on(event: "message", listener: MessageListener): unknown
  on(event: "error", listener: ErrorListener): unknown
  on(event: "reconnecting" | "ready" | "close" | "end", listener: ConnectionListener): unknown
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isTipFeedEvent(value: unknown): value is TipFeedEvent {
  if (typeof value !== "object" || value === null) return false
  const event = value as Partial<TipFeedEvent>
  return (
    typeof event.seq === "number" &&
    typeof event.streamId === "string" &&
    typeof event.tipId === "string" &&
    typeof event.emittedAt === "string"
  )
}

/**
 * Redis pub/sub adapter: events are published to one channel per stream, and a
 * channel is only subscribed while at least one local listener is attached.
 */
export class RedisTipEventBus implements TipEventBus {
  private readonly listenersByChannel = new Map<string, Set<TipEventListener>>()
  private readonly messageListener: MessageListener

  constructor(private readonly client: TipEventRedisClient) {
    this.messageListener = (channel, message) => this.handleMessage(channel, message)

    // An "error" listener is mandatory: without one an ioredis error event is
    // unhandled and can take the process down.
    this.client.on("error", (error) => {
      logger.warn("Redis tip event bus client error", { error: describeError(error) })
    })
    this.client.on("message", this.messageListener)
    this.client.on("reconnecting", () => {
      logger.warn("Redis tip event bus reconnecting; restoring channel subscriptions")
    })
    this.client.on("ready", () => {
      // Pub/sub subscriptions are connection-scoped; restore ours if the
      // connection went away (ioredis also re-subscribes, which is idempotent).
      this.resubscribe()
    })
  }

  publish(event: TipEventInput): TipFeedEvent {
    const fullEvent = toTipFeedEvent(event)
    const channel = tipEventChannel(event.streamId)

    try {
      void Promise.resolve(this.client.publish(channel, JSON.stringify(fullEvent))).catch(
        (error: unknown) => {
          logger.warn("Failed to publish tip event to Redis", {
            channel,
            error: describeError(error),
          })
        }
      )
    } catch (error) {
      logger.warn("Failed to publish tip event to Redis", {
        channel,
        error: describeError(error),
      })
    }

    return fullEvent
  }

  subscribe(streamId: string, listener: TipEventListener): () => void {
    const channel = tipEventChannel(streamId)
    let listeners = this.listenersByChannel.get(channel)
    if (!listeners) {
      listeners = new Set()
      this.listenersByChannel.set(channel, listeners)
    }

    const isFirstListener = listeners.size === 0
    listeners.add(listener)
    if (isFirstListener) {
      void this.subscribeChannel(channel)
    }

    let unsubscribed = false
    return () => {
      if (unsubscribed) return
      unsubscribed = true

      const current = this.listenersByChannel.get(channel)
      if (!current) return
      current.delete(listener)
      if (current.size === 0) {
        this.listenersByChannel.delete(channel)
        void this.unsubscribeChannel(channel)
      }
    }
  }

  private async subscribeChannel(channel: string): Promise<void> {
    if (!this.listenersByChannel.has(channel)) return
    try {
      await this.client.subscribe(channel)
    } catch (error) {
      logger.warn("Failed to subscribe to Redis tip event channel", {
        channel,
        error: describeError(error),
      })
    }
  }

  private async unsubscribeChannel(channel: string): Promise<void> {
    try {
      await this.client.unsubscribe(channel)
    } catch (error) {
      logger.warn("Failed to unsubscribe from Redis tip event channel", {
        channel,
        error: describeError(error),
      })
    }
  }

  private resubscribe(): void {
    for (const channel of this.listenersByChannel.keys()) {
      void this.subscribeChannel(channel)
    }
  }

  private handleMessage(channel: string, message: string): void {
    const listeners = this.listenersByChannel.get(channel)
    if (!listeners || listeners.size === 0) return

    let event: unknown
    try {
      event = JSON.parse(message) as unknown
    } catch (error) {
      logger.warn("Discarded malformed tip event from Redis", {
        channel,
        error: describeError(error),
      })
      return
    }

    if (!isTipFeedEvent(event)) {
      logger.warn("Discarded invalid tip event from Redis", { channel })
      return
    }

    // One bad listener must not stop delivery to the other SSE connections.
    for (const listener of [...listeners]) {
      try {
        listener(event)
      } catch (error) {
        logger.warn("Redis tip event listener failed", {
          channel,
          error: describeError(error),
        })
      }
    }
  }
}
