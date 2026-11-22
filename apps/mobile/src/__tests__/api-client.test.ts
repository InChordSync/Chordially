import { apiFetch, NetworkError, setAuthTokenGetter, setOnUnauthorized } from "../services/api-client"

describe("mobile apiFetch (#1401, #1402)", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    setAuthTokenGetter(null)
    setOnUnauthorized(null)
    jest.restoreAllMocks()
  })

  it("injects Authorization header from token getter (#1401)", async () => {
    setAuthTokenGetter(() => "tok123")
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as any)

    await apiFetch("/x")
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    )
    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers as Headers
    expect(headers.get("Authorization")).toBe("Bearer tok123")
  })

  it("wraps network failures in NetworkError (#1402)", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Network request failed"))
    await expect(apiFetch("/x")).rejects.toBeInstanceOf(NetworkError)
  })
})
