import React from "react"
import { render, fireEvent } from "@testing-library/react-native"
import { SavedCreatorsScreen } from "../screens/SavedCreatorsScreen"

const sampleSaved = [
  { id: "c1", displayName: "Aria Melody", slug: "ariam", followerCount: 1500 },
]

describe("SavedCreatorsScreen (#691)", () => {
  it("renders saved creators and handles removal", () => {
    const mockRemove = jest.fn()
    const { getByTestId, getByText } = render(
      <SavedCreatorsScreen initialSavedCreators={sampleSaved} onRemoveBookmark={mockRemove} />
    )

    expect(getByText("Saved Creators")).toBeTruthy()
    expect(getByText("Aria Melody")).toBeTruthy()

    const removeBtn = getByTestId("remove-saved-btn-c1")
    fireEvent.press(removeBtn)

    expect(mockRemove).toHaveBeenCalledWith("c1")
    expect(getByTestId("empty-saved-creators-state")).toBeTruthy()
  })
})
