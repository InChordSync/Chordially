import { describe, expect, it } from "vitest"
import { DeploymentProbesController } from "../controllers/deployment-probes.controller.js"

describe("DeploymentProbesController", () => {
  const controller = new DeploymentProbesController()

  it("reports the process as live", () => {
    const probe = controller.getLivenessProbe()
    expect(probe.status).toBe("live")
    expect(probe.uptimeSeconds).toBeGreaterThanOrEqual(0)
    expect(new Date(probe.timestamp).getTime()).not.toBeNaN()
  })

  it("reports ready when all subsystems are healthy", () => {
    const probe = controller.getReadinessProbe(true, true)
    expect(probe.status).toBe("ready")
    expect(probe.databaseConnected).toBe(true)
    expect(probe.cacheConnected).toBe(true)
    expect(probe.subsystems.every((s) => s.status === "healthy")).toBe(true)
  })

  it("reports not_ready when the database is down", () => {
    const probe = controller.getReadinessProbe(false, true)
    expect(probe.status).toBe("not_ready")
    expect(probe.databaseConnected).toBe(false)
    expect(probe.subsystems.find((s) => s.subsystemName === "postgres")?.status).toBe("unhealthy")
  })

  it("reports not_ready when the cache is down", () => {
    const probe = controller.getReadinessProbe(true, false)
    expect(probe.status).toBe("not_ready")
    expect(probe.cacheConnected).toBe(false)
    expect(probe.subsystems.find((s) => s.subsystemName === "redis")?.status).toBe("unhealthy")
  })
})
