import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
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

  it("honours props on mount (#1414)", () => {
    const { getByText } = render(<SavedCreatorsScreen initialSavedCreators={sampleSaved} />)
    expect(getByText("Aria Melody")).toBeTruthy()
  })

  it("rolls back removal when onRemoveBookmark fails (#1415)", async () => {
    const onRemoveBookmark = jest.fn().mockRejectedValue(new Error("fail"))
    const { getByTestId, getByText, queryByTestId } = render(
      <SavedCreatorsScreen initialSavedCreators={sampleSaved} onRemoveBookmark={onRemoveBookmark} />
    )

    fireEvent.press(getByTestId("remove-saved-btn-c1"))
    await waitFor(() => expect(getByText("Aria Melody")).toBeTruthy())
    expect(queryByTestId("empty-saved-creators-state")).toBeNull()
  })
})
