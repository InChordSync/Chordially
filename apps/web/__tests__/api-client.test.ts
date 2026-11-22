import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError, apiFetch, handleUnauthorized } from "../lib/api-client"
import { getCreatorBySlug, searchCreators } from "../lib/creator-client"
import { getAvatarUploadUrl, getMe, updateMe } from "../lib/user-client"

const TOKEN_KEY = "chordially.token"
const USER_KEY = "chordially.user"

describe("api-client (#1383)", () => {
  const originalFetch = global.fetch
  const originalLocation = window.location

  beforeEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, assign: vi.fn() },
      writable: true,
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    Object.defineProperty(window, "location", { value: originalLocation, writable: true })
  })

  it("returns parsed JSON on 200", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as any)

    await expect(apiFetch("/ok")).resolves.toEqual({ ok: true })
  })

  it("throws ApiError with envelope message on 4xx", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Bad request" } }),
    } as any)

    await expect(apiFetch("/bad")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "Bad request",
    })
  })

  it("throws fallback message on 5xx non-JSON/HTML response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => { throw new Error("not json") },
    } as any)

    await expect(apiFetch("/boom")).rejects.toBeInstanceOf(ApiError)
    await expect(apiFetch("/boom")).rejects.toMatchObject({ status: 500, message: "Something went wrong" })
  })

  it("propagates network errors", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Network down"))
    await expect(apiFetch("/net")).rejects.toThrow("Network down")
  })

  it("handleUnauthorized clears keys and navigates to /login", () => {
    window.localStorage.setItem(TOKEN_KEY, "t")
    window.localStorage.setItem(USER_KEY, "u")

    handleUnauthorized()

    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(window.localStorage.getItem(USER_KEY)).toBeNull()
    expect(window.location.assign).toHaveBeenCalledWith("/login")
  })

  it("triggers unauthorized handling on 401", async () => {
    window.localStorage.setItem(TOKEN_KEY, "t")
    window.localStorage.setItem(USER_KEY, "u")
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: "Unauthorized" } }),
    } as any)

    await expect(apiFetch("/private")).rejects.toMatchObject({ status: 401 })
    expect(window.location.assign).toHaveBeenCalledWith("/login")
  })

  it("covers creator-client request shapes", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] } as any)

    await getCreatorBySlug("alice")
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/creators/alice"),
      expect.objectContaining({ credentials: "include" }),
    )

    await searchCreators({ genre: "jazz", location: "NYC", liveOnly: true }, "tok")
    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("/api/creators/search?genre=jazz&location=NYC&liveOnly=true"),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tok" }) }),
    )
  })

  it("covers user-client request shapes", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) } as any)

    await getMe("tok")
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/me"),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tok" }) }),
    )

    await getAvatarUploadUrl("tok", "image/png")
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/me/avatar-upload-url"),
      expect.objectContaining({ method: "POST" }),
    )

    await updateMe("tok", { displayName: "A" } as any)
    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("/api/users/me"),
      expect.objectContaining({ method: "PATCH" }),
    )
  })
})
