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

  it("shows empty state when list is empty (#1409)", () => {
    const { getByTestId, getByText } = render(<FanExploreScreen initialCreators={[]} />)
    expect(getByTestId("explore-empty-state")).toBeTruthy()
    expect(getByText("Pull down to refresh and try again.")).toBeTruthy()
  })

  it("clamps follower count at zero (#1410)", async () => {
    const onFollowToggle = jest.fn().mockResolvedValue(true)
    const { getByTestId, getByText } = render(
      <CompactCreatorCard id="c2" displayName="Zero" slug="zero" followerCount={0} isFollowing={true} onFollowToggle={onFollowToggle} />
    )
    fireEvent.press(getByTestId("follow-toggle-btn-c2"))
    await waitFor(() => expect(getByText("0 followers")).toBeTruthy())
  })

  it("exposes accessible follow button props (#1411)", () => {
    const { getByTestId } = render(
      <CompactCreatorCard id="c3" displayName="Aria" slug="aria" followerCount={1} isFollowing={false} />
    )
    const btn = getByTestId("follow-toggle-btn-c3")
    expect(btn.props.accessibilityRole).toBe("button")
    expect(btn.props.accessibilityLabel).toContain("Aria")
  })

  it("syncs when props change (#1412)", () => {
    const { getByText, rerender } = render(
      <CompactCreatorCard id="c4" displayName="Sync" slug="sync" followerCount={1} isFollowing={false} />
    )
    expect(getByText("Follow")).toBeTruthy()
    rerender(<CompactCreatorCard id="c4" displayName="Sync" slug="sync" followerCount={99} isFollowing={true} />)
    expect(getByText("Following")).toBeTruthy()
    expect(getByText("99 followers")).toBeTruthy()
  })
})
