import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { apiFetch } from "../lib/api-client"
import { getApiBaseUrl } from "../lib/api-config"
import { loginUser } from "../lib/auth-client"
import {
  fetchLivenessProbe,
  fetchReadinessProbe,
} from "../lib/deployment-probe-client"
import { submitTipToCreator } from "../lib/tip-submission-client"

const DEFAULT_BASE_URL = "http://localhost:4000"
const CONFIGURED_BASE_URL = "https://api.example.test"
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL
const originalFetch = global.fetch

function mockFetchJson(data: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => data,
  } as unknown as Response)
}

describe("getApiBaseUrl (#1357)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    delete process.env.NEXT_PUBLIC_API_URL
    mockFetchJson({})
  })

  afterEach(() => {
    global.fetch = originalFetch
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl
    }
  })

  it("defaults to the local API origin without an /api suffix", () => {
    expect(getApiBaseUrl()).toBe(DEFAULT_BASE_URL)
  })

  it("uses NEXT_PUBLIC_API_URL and normalises a trailing /api or slash", () => {
    process.env.NEXT_PUBLIC_API_URL = `${CONFIGURED_BASE_URL}/api/`
    expect(getApiBaseUrl()).toBe(CONFIGURED_BASE_URL)
  })

  it("points apiFetch at the configured origin with a single /api prefix", async () => {
    process.env.NEXT_PUBLIC_API_URL = CONFIGURED_BASE_URL

    await apiFetch("/api/users/me")

    expect(global.fetch).toHaveBeenCalledWith(
      `${CONFIGURED_BASE_URL}/api/users/me`,
      expect.anything()
    )
  })

  it("points the auth client at the configured origin", async () => {
    process.env.NEXT_PUBLIC_API_URL = CONFIGURED_BASE_URL

    await loginUser({ email: "user@example.test", password: "password1" })

    expect(global.fetch).toHaveBeenCalledWith(
      `${CONFIGURED_BASE_URL}/api/auth/login`,
      expect.anything()
    )
  })

  it("points the tip submission client at the configured origin", async () => {
    process.env.NEXT_PUBLIC_API_URL = CONFIGURED_BASE_URL
    mockFetchJson({ intentId: "intent-1" })

    await submitTipToCreator({
      creatorId: "creator-1",
      amountXlm: 1,
      senderPublicKey: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    })

    expect(global.fetch).toHaveBeenCalledWith(
      `${CONFIGURED_BASE_URL}/api/tips/submit`,
      expect.anything()
    )
  })

  it("points the deployment probe client at the configured origin", async () => {
    process.env.NEXT_PUBLIC_API_URL = CONFIGURED_BASE_URL
    mockFetchJson({
      status: "live",
      uptimeSeconds: 1,
      timestamp: "2026-01-01T00:00:00.000Z",
    })

    await fetchLivenessProbe()

    expect(global.fetch).toHaveBeenCalledWith(`${CONFIGURED_BASE_URL}/healthz`)

    mockFetchJson({
      status: "ready",
      databaseConnected: true,
      cacheConnected: false,
      subsystems: [],
      timestamp: "2026-01-01T00:00:00.000Z",
    })

    await fetchReadinessProbe()

    expect(global.fetch).toHaveBeenCalledWith(`${CONFIGURED_BASE_URL}/readyz`)
  })
})
