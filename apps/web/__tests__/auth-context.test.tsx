import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthProvider, useAuth } from "../lib/auth-context"
import { loginUser, registerUser } from "../lib/auth-client"

vi.mock("../lib/auth-client", () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}))

const TOKEN_KEY = "chordially.token"
const USER_KEY = "chordially.user"

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe("AuthProvider (#1382)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it("hydrates from valid storage", async () => {
    window.localStorage.setItem(TOKEN_KEY, "tok")
    window.localStorage.setItem(USER_KEY, JSON.stringify({ id: "u1", email: "a@b.com" }))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.token).toBe("tok")
    expect(result.current.user).toMatchObject({ id: "u1" })
  })

  it("handles corrupt storage gracefully", async () => {
    window.localStorage.setItem(TOKEN_KEY, "tok")
    window.localStorage.setItem(USER_KEY, "{bad json")

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(window.localStorage.getItem(USER_KEY)).toBeNull()
  })

  it("persists login and logout clears session", async () => {
    vi.mocked(loginUser).mockResolvedValue({ user: { id: "u2", email: "b@b.com" } as any, token: "tok2" })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.login({ email: "b@b.com", password: "password123" } as any)
    })

    expect(result.current.token).toBe("tok2")
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe("tok2")
    expect(JSON.parse(window.localStorage.getItem(USER_KEY)!)).toMatchObject({ id: "u2" })

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it("persists register", async () => {
    vi.mocked(registerUser).mockResolvedValue({ user: { id: "u3", email: "c@b.com" } as any, token: "tok3" })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.register({ email: "c@b.com", password: "password123", displayName: "C" } as any)
    })

    expect(result.current.token).toBe("tok3")
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe("tok3")
  })

  it("throws when useAuth is used outside provider", () => {
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used within an AuthProvider")
  })
})
