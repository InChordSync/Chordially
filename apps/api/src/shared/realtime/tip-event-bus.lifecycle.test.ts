import { describe, expect, it, vi } from "vitest"
import { tipEventBus } from "./tip-event-bus.js"
import { TipEventBusLifecycle } from "./tip-event-bus.lifecycle.js"

describe("TipEventBusLifecycle", () => {
  it("closes the bus on application shutdown", () => {
    const close = vi.spyOn(tipEventBus, "close").mockImplementation(() => {})

    new TipEventBusLifecycle().onApplicationShutdown()

    expect(close).toHaveBeenCalledOnce()
    close.mockRestore()
  })
})
