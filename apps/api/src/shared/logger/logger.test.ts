import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { env } from "../config/env.js"
import { logger } from "./logger.js"
import { runWithRequestContext } from "./request-context.js"

type Captured = { log: string[]; warn: string[]; error: string[] }

/** Collects what the logger writes to the console for the current test. */
function captureConsole(): Captured {
  const captured: Captured = { log: [], warn: [], error: [] }

  for (const level of ["log", "warn", "error"] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      captured[level].push(String(args[0]))
    })
  }

  return captured
}

describe("logger", () => {
  let nodeEnv: typeof env.NODE_ENV
  let logLevel: typeof env.LOG_LEVEL

  beforeEach(() => {
    nodeEnv = env.NODE_ENV
    logLevel = env.LOG_LEVEL
  })

  afterEach(() => {
    env.NODE_ENV = nodeEnv
    env.LOG_LEVEL = logLevel
    vi.restoreAllMocks()
  })

  describe("outside development", () => {
    beforeEach(() => {
      env.NODE_ENV = "production"
    })

    it("emits one JSON object per line", () => {
      const out = captureConsole()

      logger.info("wallet topped up", { walletId: "w_1" })

      expect(out.log).toHaveLength(1)
      expect(JSON.parse(out.log[0])).toMatchObject({
        level: "info",
        message: "wallet topped up",
        meta: { walletId: "w_1" },
      })
      expect(typeof JSON.parse(out.log[0]).timestamp).toBe("string")
    })

    it("routes each level to the matching stream", () => {
      const out = captureConsole()

      logger.info("i")
      logger.warn("w")
      logger.error("e")

      expect(out.log).toHaveLength(1)
      expect(out.warn).toHaveLength(1)
      expect(out.error).toHaveLength(1)
    })

    it("omits requestId when no request is in flight", () => {
      const out = captureConsole()

      logger.info("startup")

      expect(JSON.parse(out.log[0])).not.toHaveProperty("requestId")
    })
  })

  describe("in development", () => {
    beforeEach(() => {
      env.NODE_ENV = "development"
    })

    it("emits a readable line instead of JSON", () => {
      const out = captureConsole()

      logger.info("wallet topped up", { walletId: "w_1" })

      expect(out.log[0]).toContain("INFO wallet topped up")
      expect(out.log[0]).toContain('{"walletId":"w_1"}')
      expect(() => JSON.parse(out.log[0])).toThrow()
    })
  })

  describe("request correlation", () => {
    it("stamps the in-flight request id onto every line", () => {
      env.NODE_ENV = "production"
      const out = captureConsole()

      runWithRequestContext({ requestId: "req_abc", method: "GET", path: "/api/me" }, () => {
        logger.info("loading profile")
        logger.warn("slow query", { ms: 900 })
      })

      expect(JSON.parse(out.log[0]).requestId).toBe("req_abc")
      expect(JSON.parse(out.warn[0]).requestId).toBe("req_abc")
    })
  })

  describe("LOG_LEVEL filtering", () => {
    beforeEach(() => {
      env.NODE_ENV = "production"
    })

    it("drops everything below the configured level", () => {
      env.LOG_LEVEL = "warn"
      const out = captureConsole()

      logger.info("i")
      logger.warn("w")
      logger.error("e")

      expect(out.log).toHaveLength(0)
      expect(out.warn).toHaveLength(1)
      expect(out.error).toHaveLength(1)
    })

    it("emits everything at the lowest level", () => {
      env.LOG_LEVEL = "debug"
      const out = captureConsole()

      logger.info("i")
      logger.warn("w")
      logger.error("e")

      expect(out.log).toHaveLength(1)
      expect(out.warn).toHaveLength(1)
      expect(out.error).toHaveLength(1)
    })
  })
})
