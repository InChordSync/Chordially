import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import EditProfilePage from "../app/profile/edit/page"

vi.mock("../lib/auth-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ token: "test-token", user: null, isLoading: false }),
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
const mockGetAvatarUploadUrl = vi.fn()

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
  getAvatarUploadUrl: (...args: unknown[]) => mockGetAvatarUploadUrl(...args),
  updateMe: (...args: unknown[]) => mockUpdateMe(...args),
}))

describe("EditProfilePage", () => {
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

  it("uploads avatar with progress and submits avatarUrl (#1385)", async () => {
    const user = userEvent.setup()
    mockGetAvatarUploadUrl.mockResolvedValue({
      uploadUrl: "https://s3.example.com/upload",
      avatarUrl: "https://cdn.example.com/avatar.png",
    })

    const OriginalXHR = globalThis.XMLHttpRequest
    class MockXHR {
      upload: { onprogress: ((e: any) => void) | null } = { onprogress: null }
      status = 200
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      open = vi.fn()
      setRequestHeader = vi.fn()
      send = vi.fn(() => {
        this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 })
        this.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 })
        this.onload?.()
      })
    }
    // @ts-expect-error test mock
    globalThis.XMLHttpRequest = MockXHR

    render(<EditProfilePage />)
    const file = new File(["img"], "avatar.png", { type: "image/png" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(await screen.findByText(/photo uploaded/i)).toBeInTheDocument()
    expect(mockGetAvatarUploadUrl).toHaveBeenCalledWith("test-token", "image/png")

    await user.click(screen.getByRole("button", { name: /save changes/i }))
    expect(mockUpdateMe).toHaveBeenCalledWith(
      "test-token",
      expect.objectContaining({ avatarUrl: "https://cdn.example.com/avatar.png" })
    )

    globalThis.XMLHttpRequest = OriginalXHR
  })

  it("shows upload error when avatar upload fails (#1385)", async () => {
    const user = userEvent.setup()
    mockGetAvatarUploadUrl.mockRejectedValue(new Error("upload failed"))

    render(<EditProfilePage />)
    const file = new File(["img"], "avatar.png", { type: "image/png" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(await screen.findByText(/upload failed|failed to upload/i)).toBeInTheDocument()
  })
})
