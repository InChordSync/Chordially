import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../services/dependency-health.service.js", () => ({
  dependencyHealthService: {
    checkDatabase: vi.fn(),
    checkCache: vi.fn(),
  },
}))

const { deploymentProbesController } = await import("../controllers/deployment-probes.controller.js")
const { dependencyHealthService } = await import("../services/dependency-health.service.js")

describe("DeploymentProbesController readiness", () => {
  beforeEach(() => {
    vi.mocked(dependencyHealthService.checkDatabase).mockResolvedValue({ ok: true, latencyMs: 5 })
    vi.mocked(dependencyHealthService.checkCache).mockResolvedValue({ ok: true, latencyMs: 2 })
  })

  it("is ready when the database and cache are both healthy", async () => {
    const probe = await deploymentProbesController.getReadinessProbe()
    expect(probe.status).toBe("ready")
    expect(probe.databaseConnected).toBe(true)
    expect(probe.cacheConnected).toBe(true)
  })

  it("is not ready when the database is unhealthy", async () => {
    vi.mocked(dependencyHealthService.checkDatabase).mockResolvedValueOnce({
      ok: false,
      latencyMs: 1500,
      message: "database unreachable",
    })

    const probe = await deploymentProbesController.getReadinessProbe()
    expect(probe.status).toBe("not_ready")
    expect(probe.databaseConnected).toBe(false)
    expect(probe.subsystems.find((s) => s.subsystemName === "postgres")?.status).toBe("unhealthy")
  })

  it("is not ready when the cache is unhealthy", async () => {
    vi.mocked(dependencyHealthService.checkCache).mockResolvedValueOnce({
      ok: false,
      latencyMs: 1500,
      message: "cache unreachable",
    })

    const probe = await deploymentProbesController.getReadinessProbe()
    expect(probe.status).toBe("not_ready")
    expect(probe.cacheConnected).toBe(false)
    expect(probe.subsystems.find((s) => s.subsystemName === "redis")?.status).toBe("unhealthy")
  })
})

describe("DeploymentProbesController liveness", () => {
  it("reports live with an uptime", () => {
    const probe = deploymentProbesController.getLivenessProbe()
    expect(probe.status).toBe("live")
    expect(probe.uptimeSeconds).toBeGreaterThanOrEqual(0)
  })
})
