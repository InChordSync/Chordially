import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { FollowCountSummary } from "../src/components/FollowCountSummary"

describe("FollowCountSummary Component (#693)", () => {
  it("renders formatted numbers and handles clicks", () => {
    const mockClickFollowers = vi.fn()
    const mockClickFollowing = vi.fn()

    render(
      <FollowCountSummary
        followersCount={12500}
        followingCount={340}
        onClickFollowers={mockClickFollowers}
        onClickFollowing={mockClickFollowing}
      />
    )

    expect(screen.getByTestId("followers-count-val").textContent).toBe("12.5k")
    expect(screen.getByTestId("following-count-val").textContent).toBe("340")

    fireEvent.click(screen.getByTestId("followers-stat-btn"))
    expect(mockClickFollowers).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByTestId("following-stat-btn"))
    expect(mockClickFollowing).toHaveBeenCalledOnce()
  })
})
