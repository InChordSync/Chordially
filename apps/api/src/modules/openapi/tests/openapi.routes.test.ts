import request from "supertest"
import { describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"

const app = createApp()

describe("OpenAPI spec", () => {
  it("serves the openapi.json with an openapi version field", async () => {
    const res = await request(app).get("/api/docs/openapi.json")

    expect(res.status).toBe(200)
    expect(typeof res.body.openapi).toBe("string")
    expect(res.body.openapi.startsWith("3.")).toBe(true)
    expect(res.body.info.title).toBe("Chordially API")
  })

  it("serves a basic docs index", async () => {
    const res = await request(app).get("/api/docs")

    expect(res.status).toBe(200)
    expect(res.body.spec).toBe("/api/docs/openapi.json")
    expect(Array.isArray(res.body.paths)).toBe(true)
  })
})
