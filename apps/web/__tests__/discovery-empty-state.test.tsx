import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { DiscoveryEmptyState } from "../src/components/DiscoveryEmptyState"

describe("DiscoveryEmptyState Component (#687)", () => {
  it("renders query message and suggestions", () => {
    const mockSuggestionClick = vi.fn()
    render(
      <DiscoveryEmptyState
        query="Unicorn"
        onSuggestionClick={mockSuggestionClick}
      />
    )

    expect(screen.getByTestId("discovery-empty-state")).toBeDefined()
    expect(screen.getByText('We couldn\'t find matches for "Unicorn"')).toBeDefined()

    const popChip = screen.getByTestId("suggestion-chip-Pop")
    fireEvent.click(popChip)
    expect(mockSuggestionClick).toHaveBeenCalledWith("Pop")
  })

  it("handles filter reset button", () => {
    const mockReset = vi.fn()
    render(<DiscoveryEmptyState onResetFilters={mockReset} />)

    const resetBtn = screen.getByTestId("reset-filters-btn")
    fireEvent.click(resetBtn)
    expect(mockReset).toHaveBeenCalledOnce()
  })
})
