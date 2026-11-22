import { render, screen, fireEvent, waitFor } from "@testing-library/react-native"
import { act } from "react"
import CreatorProfileScreen from "../src/screens/CreatorProfileScreen"
import { NetworkError } from "../src/services/api-client"

jest.mock("../src/services/creator-service", () => ({
  getCreatorBySlug: jest.fn(),
}))

const { getCreatorBySlug } = jest.requireMock("../src/services/creator-service")

describe("CreatorProfileScreen error/retry (#1404)", () => {
  it("shows retry and reloads", async () => {
    getCreatorBySlug.mockRejectedValueOnce(new NetworkError("offline")).mockResolvedValueOnce({
      id: "1", userId: "u1", displayName: "A", slug: "a", bio: null, avatarUrl: null, genre: null, location: null, isVerified: false, createdAt: "", updatedAt: "",
    })
    render(<CreatorProfileScreen slug="a" />)
    expect(await screen.findByText(/offline/i)).toBeTruthy()
    fireEvent.press(screen.getByTestId("profile-retry-btn"))
    await waitFor(() => expect(screen.getByText("A")).toBeTruthy())
  })
})
