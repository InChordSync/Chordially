import { describe, expect, it } from "vitest"
import { envSchema } from "../env.js"

const baseEnv = {
  DATABASE_URL: "file:./test.db",
  JWT_SECRET: "a-very-long-jwt-secret-that-is-at-least-32-chars",
}

function parse(overrides: Record<string, string>) {
  return envSchema.safeParse({ ...baseEnv, ...overrides })
}

describe("envBoolean", () => {
  it.each([
    ["false", false],
    ["0", false],
    ["no", false],
    ["off", false],
    ["true", true],
    ["1", true],
    ["yes", true],
    ["on", true],
  ])("parses %s as %s instead of coercing every string to true", (raw, expected) => {
    const result = parse({ RECONCILIATION_ENABLED: raw })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.RECONCILIATION_ENABLED).toBe(expected)
  })

  it("rejects an unrecognised boolean string", () => {
    expect(parse({ RECONCILIATION_ENABLED: "maybe" }).success).toBe(false)
  })
})

describe("production env validation", () => {
  const production = {
    NODE_ENV: "production",
    AWS_ACCESS_KEY_ID: "AKIAEXAMPLE",
    AWS_SECRET_ACCESS_KEY: "secret",
    AWS_S3_BUCKET: "chordially-uploads",
    AWS_KMS_KEY_ID: "alias/chordially",
    DEPOSIT_WEBHOOK_SECRET: "deposit-secret",
    CREATOR_PAYOUT_WEBHOOK_SECRET: "payout-secret",
  }

  it("accepts a complete production configuration", () => {
    expect(parse(production).success).toBe(true)
  })

  it("rejects a short JWT_SECRET", () => {
    const result = parse({ ...production, JWT_SECRET: "short" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "JWT_SECRET")).toBe(true)
    }
  })

  it("rejects missing AWS settings", () => {
    const result = parse({ ...production, AWS_S3_BUCKET: "", AWS_KMS_KEY_ID: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0])
      expect(paths).toContain("AWS_S3_BUCKET")
      expect(paths).toContain("AWS_KMS_KEY_ID")
    }
  })

  it("rejects missing webhook secrets", () => {
    const result = parse({ ...production, DEPOSIT_WEBHOOK_SECRET: "", CREATOR_PAYOUT_WEBHOOK_SECRET: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0])
      expect(paths).toContain("DEPOSIT_WEBHOOK_SECRET")
      expect(paths).toContain("CREATOR_PAYOUT_WEBHOOK_SECRET")
    }
  })
})
