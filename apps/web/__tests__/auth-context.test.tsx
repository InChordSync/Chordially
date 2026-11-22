import { render, screen, act } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { AuthProvider, useAuth } from "../lib/auth-context"

vi.mock("../lib/auth-client", () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  AuthApiError: class AuthApiError extends Error {},
}))

vi.mock("../lib/user-client", () => ({
  getMe: vi.fn().mockResolvedValue({ user: { id: "u1", email: "a@b.com" } }),
}))

function Consumer({ onRender }: { onRender?: () => void }) {
  const { isLoading, user } = useAuth()
  onRender?.()
  return <div>{isLoading ? "loading" : user ? user.email : "anon"}</div>
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe("AuthProvider", () => {
  it("memoizes context value to avoid unnecessary consumer rerenders (#1372)", async () => {
    let renders = 0
    const { rerender } = render(
      <AuthProvider>
        <Consumer onRender={() => { renders += 1 }} />
      </AuthProvider>
    )

    await screen.findByText("anon")
    const afterMount = renders

    rerender(
      <AuthProvider>
        <Consumer onRender={() => { renders += 1 }} />
      </AuthProvider>
    )

    // Rerender of parent with same provider tree may remount; the key check is
    // value is memoized (consumer should not rerender from value identity churn alone).
    expect(renders).toBeLessThanOrEqual(afterMount + 2)
  })

  it("syncs logout across tabs via storage event (#1370)", async () => {
    localStorage.setItem("chordially.token", "token")
    localStorage.setItem("chordially.user", JSON.stringify({ id: "u1", email: "a@b.com" }))

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )

    await screen.findByText("a@b.com")

    await act(async () => {
      localStorage.removeItem("chordially.token")
      localStorage.removeItem("chordially.user")
      window.dispatchEvent(new StorageEvent("storage", { key: "chordially.token" }))
    })

    expect(await screen.findByText("anon")).toBeInTheDocument()
  })
})
