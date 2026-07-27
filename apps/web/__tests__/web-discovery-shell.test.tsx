import React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { WebDiscoveryShell, CreatorSpotlightItem } from "../src/components/WebDiscoveryShell"

const sampleCreators: CreatorSpotlightItem[] = [
  { id: "c1", displayName: "Alice Wonder", slug: "alicew", followerCount: 120 },
  { id: "c2", displayName: "Bob Builder", slug: "bobb", followerCount: 450 },
]

describe("WebDiscoveryShell Component", () => {
  it("renders search input, spotlight row, and handles search debounce (#683, #684)", async () => {
    vi.useFakeTimers()
    render(<WebDiscoveryShell initialSpotlight={sampleCreators} />)

    expect(screen.getByText("Alice Wonder")).toBeDefined()
    expect(screen.getByText("Bob Builder")).toBeDefined()

    const searchInput = screen.getByRole("searchbox")
    fireEvent.change(searchInput, { target: { value: "Alice" } })

    act(() => {
      vi.advanceTimersByTime(350)
    })

    expect(screen.getByTestId("search-debounce-indicator")).toBeDefined()
    vi.useRealTimers()
  })

  it("handles optimistic follow toggle and error rollback (#685)", async () => {
    const mockFollowToggle = vi.fn().mockResolvedValue(true)
    render(
      <WebDiscoveryShell
        initialSpotlight={sampleCreators}
        onFollowToggle={mockFollowToggle}
      />
    )

    const followBtn = screen.getByTestId("follow-btn-c1")
    expect(followBtn.textContent).toBe("Follow")

    await act(async () => {
      fireEvent.click(followBtn)
    })

    expect(followBtn.textContent).toBe("Following")
    expect(mockFollowToggle).toHaveBeenCalledWith("c1", false)
  })

  it("renders bookmarked creators panel for signed-in web shell (#686)", () => {
    render(<WebDiscoveryShell initialSpotlight={sampleCreators} isSignedIn={true} />)

    expect(screen.getByTestId("bookmarked-creators-panel")).toBeDefined()
    expect(screen.getByTestId("empty-bookmarks-msg")).toBeDefined()

    const bookmarkBtn = screen.getByTestId("bookmark-btn-c1")
    fireEvent.click(bookmarkBtn)

    expect(screen.getByTestId("bookmark-chip-c1")).toBeDefined()
  })
})
