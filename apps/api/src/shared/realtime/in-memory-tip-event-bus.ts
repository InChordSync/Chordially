import { EventEmitter } from "node:events"
import {
  tipEventChannel,
  toTipFeedEvent,
  type TipEventBus,
  type TipEventInput,
  type TipEventListener,
  type TipFeedEvent,
} from "./tip-event.js"

/**
 * Process-local adapter. An emitter can be injected so two instances can share
 * a broker (useful for tests; a real multi-process deployment uses Redis).
 */
export class InMemoryTipEventBus implements TipEventBus {
  constructor(private readonly emitter: EventEmitter = new EventEmitter()) {
    this.emitter.setMaxListeners(0)
  }

  publish(event: TipEventInput): TipFeedEvent {
    const fullEvent = toTipFeedEvent(event)
    this.emitter.emit(tipEventChannel(event.streamId), fullEvent)
    return fullEvent
  }

  subscribe(streamId: string, listener: TipEventListener): () => void {
    const channel = tipEventChannel(streamId)
    this.emitter.on(channel, listener)
    return () => {
      this.emitter.off(channel, listener)
    }
  }
}
