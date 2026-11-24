import type { INestApplication } from "@nestjs/common"
import request from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createE2eApp, registerAndLogin } from "./utils/app.js"

describe("Wallet (e2e)", () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createE2eApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it("returns the primary wallet to its owner", async () => {
    const token = await registerAndLogin(app, "e2e-wallet@example.com")

    const res = await request(app.getHttpServer())
      .get("/api/wallet/me")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.wallet).toBeDefined()
    expect(res.body.wallet.publicKey).toEqual(expect.any(String))
  })

  it("rejects an unauthenticated wallet lookup", async () => {
    const res = await request(app.getHttpServer()).get("/api/wallet/me")
    expect(res.status).toBe(401)
  })
})
