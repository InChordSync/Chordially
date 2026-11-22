import { describe, expect, it } from "vitest"
import { LocalMockApiServerService } from "../services/local-mock-api-server.service.js"

describe("LocalMockApiServerService", () => {
  it("is disabled by default", () => {
    const service = new LocalMockApiServerService()
    expect(service.getConfig().isEnabled).toBe(false)
  })

  it("applies a default port when none is supplied", () => {
    const service = new LocalMockApiServerService()
    expect(service.getConfig().port).toBe(4001)
  })

  it("accepts an initial port override", () => {
    const service = new LocalMockApiServerService({ port: 4200 })
    expect(service.getConfig().port).toBe(4200)
  })

  it("enableMockMode turns the server on", () => {
    const service = new LocalMockApiServerService()
    service.enableMockMode()
    expect(service.getConfig().isEnabled).toBe(true)
  })

  it("defaults to an empty routes array", () => {
    const service = new LocalMockApiServerService()
    expect(service.getConfig().routes).toEqual([])
  })
})
