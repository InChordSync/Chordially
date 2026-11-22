import { render, screen } from "@testing-library/react-native"
import { act } from "react"
import CreatorProfileScreen from "../screens/CreatorProfileScreen"

const mockProfile = {
  id: "cp-1",
  userId: "u-1",
  displayName: "Solar Vibes",
  slug: "solar-vibes",
  bio: "Indie producer from Lagos",
  avatarUrl: null,
  genre: "Indie",
  location: "Lagos",
  isVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

let resolveProfile: (value: typeof mockProfile) => void

jest.mock("../services/creator-service", () => ({
  getCreatorBySlug: jest.fn(
    () =>
      new Promise((resolve) => {
        resolveProfile = resolve
      })
  ),
}))

async function renderAndLoad() {
  render(<CreatorProfileScreen slug="solar-vibes" />)
  await act(async () => {
    resolveProfile(mockProfile)
  })
}

describe("CreatorProfileScreen", () => {
  it("renders the creator display name after loading", async () => {
    await renderAndLoad()
    expect(screen.getByText("Solar Vibes")).toBeTruthy()
  })

  it("renders bio, genre, and location", async () => {
    await renderAndLoad()
    expect(screen.getByText("Indie producer from Lagos")).toBeTruthy()
    expect(screen.getByText("Genre: Indie")).toBeTruthy()
    expect(screen.getByText("Location: Lagos")).toBeTruthy()
  })

  it("renders the verified badge", async () => {
    await renderAndLoad()
    expect(screen.getByLabelText("Solar Vibes, verified creator")).toBeTruthy()
  })

  it("shows default avatar when avatarUrl is null", async () => {
    await renderAndLoad()
    expect(screen.getByLabelText("Default avatar")).toBeTruthy()
  })
})
