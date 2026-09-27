import request from "supertest"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"
import { logger } from "../../../shared/logger/logger.js"

const app = createApp()

afterEach(() => {
  vi.restoreAllMocks()
})

describe("wallet audit logging", () => {
  it("writes an audit entry when a link challenge is issued", async () => {
    const infoSpy = vi.spyOn(logger, "info")

    const res = await request(app).get("/api/wallet/link-challenge").query({
      publicKey: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    })

    expect(res.status).toBe(200)
    expect(typeof res.body.challenge).toBe("string")
    expect(typeof res.body.nonce).toBe("string")

    const call = infoSpy.mock.calls.find(([message]) => message === "wallet audit event")
    expect(call).toBeDefined()
    expect(call![1]).toMatchObject({ eventType: "challenge_issued" })
    // The raw address must never appear verbatim in the audit log.
    expect(JSON.stringify(call![1])).not.toContain(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    )
  })
})
