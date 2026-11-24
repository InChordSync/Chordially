import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  checkDatabase: vi.fn(),
  checkCache: vi.fn(),
  checkMemory: vi.fn(),
  getLivenessProbe: vi.fn(),
  getReadinessProbe: vi.fn(),
}))

vi.mock("../services/dependency-health.service.js", () => ({
  dependencyHealthService: {
    checkDatabase: mocks.checkDatabase,
    checkCache: mocks.checkCache,
    checkMemory: mocks.checkMemory,
  },
}))

vi.mock("../controllers/deployment-probes.controller.js", () => ({
  deploymentProbesController: {
    getLivenessProbe: mocks.getLivenessProbe,
    getReadinessProbe: mocks.getReadinessProbe,
  },
}))

import { HealthController } from "../controllers/health.controller.js"

function mockRes() {
  const res: any = {
    statusCode: 0,
    body: undefined,
    status(code: number) { this.statusCode = code; return this },
    json(payload: unknown) { this.body = payload; return this },
  }
  return res
}

describe("HealthController", () => {
  let controller: HealthController
  let next: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new HealthController()
    next = vi.fn()
    mocks.checkDatabase.mockResolvedValue({ ok: true, latencyMs: 1 })
    mocks.checkCache.mockResolvedValue({ ok: true, latencyMs: 0 })
    mocks.checkMemory.mockReturnValue({ ok: true, latencyMs: 0, usedMb: 80, limitMb: 150 })
    mocks.getLivenessProbe.mockReturnValue({ status: "live", uptimeSeconds: 3, timestamp: "now" })
    mocks.getReadinessProbe.mockResolvedValue({ status: "ready", databaseConnected: true, cacheConnected: true })
  })

  it("reports all real subsystems in the combined health check", async () => {
    const res = mockRes()

    await controller.check(res, next)

    expect(res.statusCode).toBe(200)
    expect(res.body.checks).toMatchObject({
      database: { status: "up" },
      cache: { status: "up" },
      memory: { status: "ok", usedMb: 80, limitMb: 150 },
    })
    expect(next).not.toHaveBeenCalled()
  })

  it("returns 503 when heap usage exceeds the configured limit", async () => {
    mocks.checkMemory.mockReturnValue({
      ok: false,
      latencyMs: 0,
      usedMb: 180,
      limitMb: 150,
      message: "over limit",
    })
    const res = mockRes()

    await controller.check(res, next)

    expect(res.statusCode).toBe(503)
    expect(res.body.status).toBe("degraded")
  })

  it("serves liveness without touching dependencies", () => {
    const res = mockRes()

    controller.live(res, next)

    expect(res.statusCode).toBe(200)
    expect(mocks.checkDatabase).not.toHaveBeenCalled()
  })

  it("maps not-ready to 503", async () => {
    mocks.getReadinessProbe.mockResolvedValue({ status: "not_ready" })
    const res = mockRes()

    await controller.ready(res, next)

    expect(res.statusCode).toBe(503)
  })
})
