import { describe, expect, it } from "vitest"
import {
  MAX_REQUEST_ID_LENGTH,
  generateRequestId,
  getRequestContext,
  getRequestId,
  resolveRequestId,
  runWithRequestContext,
} from "./request-context.js"

describe("resolveRequestId", () => {
  it("adopts a caller-supplied correlation id", () => {
    expect(resolveRequestId("abc-123")).toBe("abc-123")
  })

  it("trims surrounding whitespace", () => {
    expect(resolveRequestId("  abc-123  ")).toBe("abc-123")
  })

  it("generates an id when the header is absent", () => {
    const id = resolveRequestId(undefined)

    expect(id).toMatch(/^req_[0-9a-f]{16}$/)
  })

  it("generates an id when the header is empty or only control characters", () => {
    expect(resolveRequestId("")).toMatch(/^req_/)
    expect(resolveRequestId("   ")).toMatch(/^req_/)
    expect(resolveRequestId("\n\r\t")).toMatch(/^req_/)
  })

  it("ignores a non-string header value", () => {
    // Express collapses repeated headers into an array; that is not an id.
    expect(resolveRequestId(["a", "b"])).toMatch(/^req_/)
    expect(resolveRequestId(42)).toMatch(/^req_/)
  })

  // The id is caller-supplied and lands in a log file, so an unfiltered value
  // would let a client forge log lines.
  it("strips control characters so a header cannot forge a log line", () => {
    const id = resolveRequestId("abc\n{\"level\":\"error\"}\u0000def")

    expect(id).toBe('abc{"level":"error"}def')
    expect(id).not.toContain("\n")
    expect(id).not.toContain("\u0000")
  })

  it("caps the length so a header cannot bloat the log", () => {
    const id = resolveRequestId("x".repeat(500))

    expect(id).toHaveLength(MAX_REQUEST_ID_LENGTH)
  })
})

describe("request context", () => {
  it("mints unique ids", () => {
    expect(generateRequestId()).not.toBe(generateRequestId())
  })

  it("exposes the id to code running inside the request", () => {
    const seen = runWithRequestContext(
      { requestId: "req_ctx", method: "GET", path: "/api/clinics" },
      () => getRequestId(),
    )

    expect(seen).toBe("req_ctx")
  })

  it("is undefined outside a request", () => {
    expect(getRequestId()).toBeUndefined()
    expect(getRequestContext()).toBeUndefined()
  })

  it("restores the outer context after a nested request finishes", () => {
    const order: string[] = []

    runWithRequestContext({ requestId: "outer", method: "GET", path: "/a" }, () => {
      order.push(getRequestId() ?? "none")
      runWithRequestContext({ requestId: "inner", method: "GET", path: "/b" }, () => {
        order.push(getRequestId() ?? "none")
      })
      order.push(getRequestId() ?? "none")
    })

    expect(order).toEqual(["outer", "inner", "outer"])
  })

  // A handler awaits (Prisma, a fetch) before it logs, so the context has to
  // survive the tick boundary rather than only synchronous calls.
  it("survives an await inside the request", async () => {
    const seen = await runWithRequestContext(
      { requestId: "req_async", method: "GET", path: "/api/users/me" },
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 1))
        return getRequestId()
      },
    )

    expect(seen).toBe("req_async")
    // ...and does not leak back out once the request is done.
    expect(getRequestId()).toBeUndefined()
  })
})
