import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import { CompactCreatorCard } from "../components/CompactCreatorCard"
import { FanExploreScreen } from "../screens/FanExploreScreen"

const mockCreators = [
  { id: "c1", displayName: "Luna Song", slug: "lunasong", followerCount: 300, isFollowing: false },
]

describe("Mobile Discovery Components (#688, #689, #690)", () => {
  it("renders CompactCreatorCard and handles optimistic follow rollback (#689, #690)", async () => {
    const mockFollowToggle = jest.fn().mockRejectedValue(new Error("Network error"))
    const { getByTestId, getByText } = render(
      <CompactCreatorCard
        id="c1"
        displayName="Luna Song"
        slug="lunasong"
        followerCount={300}
        isFollowing={false}
        onFollowToggle={mockFollowToggle}
      />
    )

    expect(getByText("Luna Song")).toBeTruthy()
    expect(getByText("Follow")).toBeTruthy()

    const followBtn = getByTestId("follow-toggle-btn-c1")
    fireEvent.press(followBtn)

    await waitFor(() => {
      expect(mockFollowToggle).toHaveBeenCalledWith("c1", false)
      // Rolled back to Follow
      expect(getByText("Follow")).toBeTruthy()
    })
  })

  it("renders FanExploreScreen with list header and refresh control (#688)", () => {
    const { getByTestId, getByText } = render(
      <FanExploreScreen initialCreators={mockCreators} />
    )

    expect(getByTestId("fan-explore-screen")).toBeTruthy()
    expect(getByText("Explore Creators")).toBeTruthy()
    expect(getByText("Luna Song")).toBeTruthy()
  })
})
