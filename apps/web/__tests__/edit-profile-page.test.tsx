import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import EditProfilePage from "../app/profile/edit/page"

const mockReplace = vi.fn()
let mockAuth = { token: "test-token" as string | null, user: null, isLoading: false }

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

vi.mock("../lib/auth-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuth,
}))

vi.mock("../lib/api-client", () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  },
  apiFetch: vi.fn(),
  authHeaders: (token: string) => ({ Authorization: `Bearer ${token}` }),
}))

vi.mock("../lib/auth-client", () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  AuthApiError: class AuthApiError extends Error {},
}))

const mockUpdateMe = vi.fn().mockResolvedValue({ ok: true })

vi.mock("../lib/user-client", () => ({
  getMe: vi.fn().mockResolvedValue({
    user: {
      id: "u-1",
      email: "solar@test.com",
      creatorProfile: {
        id: "cp-1",
        userId: "u-1",
        displayName: "Solar Vibes",
        slug: "solar-vibes",
        bio: "Indie vibes",
        avatarUrl: null,
        genre: "Indie",
        location: "Lagos",
        isVerified: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      fanProfile: {
        id: "fp-1",
        userId: "u-1",
        displayName: "Solar Vibes",
        avatarUrl: null,
        genrePrefs: ["jazz", "lo-fi"],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  }),
  updateMe: (...args: unknown[]) => mockUpdateMe(...args),
}))

describe("EditProfilePage", () => {
  beforeEach(() => {
    mockAuth = { token: "test-token", user: null, isLoading: false }
    mockReplace.mockReset()
    mockUpdateMe.mockClear()
  })

  it("renders loading state while auth is loading (#1366)", () => {
    mockAuth = { token: null, user: null, isLoading: true }
    render(<EditProfilePage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it("redirects unauthenticated users to login (#1366)", async () => {
    mockAuth = { token: null, user: null, isLoading: false }
    render(<EditProfilePage />)
    await screen.findByText(/loading/i)
    expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fprofile%2Fedit")
  })

  it("renders the edit form with pre-filled values", async () => {
    render(<EditProfilePage />)

    expect(await screen.findByLabelText(/display name/i)).toHaveValue(
      "Solar Vibes"
    )
    expect(screen.getByLabelText(/bio/i)).toHaveValue("Indie vibes")
    expect(screen.getByLabelText(/^genre$/i)).toHaveValue("Indie")
    expect(screen.getByLabelText(/location/i)).toHaveValue("Lagos")
    expect(screen.getByLabelText(/genre preferences/i)).toHaveValue(
      "jazz, lo-fi"
    )
  })

  it("submits valid data and shows success message", async () => {
    const user = userEvent.setup()
    render(<EditProfilePage />)

    const bioField = await screen.findByLabelText(/bio/i)
    await user.clear(bioField)
    await user.type(bioField, "Updated bio")

    await user.click(screen.getByRole("button", { name: /save changes/i }))

    expect(
      await screen.findByText(/profile updated successfully/i)
    ).toBeInTheDocument()
    expect(mockUpdateMe).toHaveBeenCalledWith(
      "test-token",
      expect.objectContaining({ bio: "Updated bio" })
    )
  })

  it("shows validation error for a display name that is too short", async () => {
    const user = userEvent.setup()
    render(<EditProfilePage />)

    const nameField = await screen.findByLabelText(/display name/i)
    await user.clear(nameField)
    await user.type(nameField, "X")

    await user.click(screen.getByRole("button", { name: /save changes/i }))

    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })

  it("clears genre, location, and genre preferences when emptied (#1365)", async () => {
    const user = userEvent.setup()
    render(<EditProfilePage />)

    await screen.findByLabelText(/display name/i)
    await user.clear(screen.getByLabelText(/^genre$/i))
    await user.clear(screen.getByLabelText(/location/i))
    await user.clear(screen.getByLabelText(/genre preferences/i))

    await user.click(screen.getByRole("button", { name: /save changes/i }))

    expect(mockUpdateMe).toHaveBeenCalledWith(
      "test-token",
      expect.objectContaining({ genre: null, location: null, genrePrefs: [] })
    )
  })
})
