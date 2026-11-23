import type { INestApplication } from "@nestjs/common"
import request from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createE2eApp } from "./utils/app.js"

describe("Health (e2e)", () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createE2eApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it("reports the process as healthy", async () => {
    const res = await request(app.getHttpServer()).get("/api/health")
    expect(res.status).toBe(200)
    expect(res.body.status).toBe("ok")
    expect(res.body.info.memory_heap.status).toBe("up")
  })
})
