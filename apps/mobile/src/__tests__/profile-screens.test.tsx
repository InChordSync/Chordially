import React from "react"
import { fireEvent, render } from "@testing-library/react-native"
import EditCreatorProfileScreen from "../screens/EditCreatorProfileScreen"
import CreatorSetupProgressScreen from "../screens/CreatorSetupProgressScreen"
import AvatarBannerPreview from "../components/AvatarBannerPreview"

describe("EditCreatorProfileScreen (#1436)", () => {
  it("blocks onSave for invalid social link", () => {
    const onSave = jest.fn()
    const { getByDisplayValue, getByText, queryByText } = render(
      <EditCreatorProfileScreen
        initial={{ bio: "bio", location: "NYC", socialLink: "invalid-link" }}
        onSave={onSave}
      />
    )

    expect(queryByText("Invalid social link URL")).toBeTruthy()
    fireEvent.press(getByText("Save"))
    expect(onSave).not.toHaveBeenCalled()

    fireEvent.changeText(getByDisplayValue("invalid-link"), "https://example.com")
    fireEvent.press(getByText("Save"))
    expect(onSave).toHaveBeenCalledWith({
      bio: "bio",
      location: "NYC",
      socialLink: "https://example.com",
    })
  })
})

describe("CreatorSetupProgressScreen (#1436)", () => {
  it("shows completed count for sample steps", () => {
    const { getByText, getByTestId } = render(
      <CreatorSetupProgressScreen
        steps={[
          { label: "Connect Stellar Wallet", done: true },
          { label: "Fill Creator Bio & Profile Details", done: false },
          { label: "Upload Avatar & Banner", done: true },
        ]}
      />
    )

    expect(getByTestId("setup-progress")).toBeTruthy()
    expect(getByText("2 of 3 steps complete")).toBeTruthy()
  })
})

describe("AvatarBannerPreview (#1436)", () => {
  it("falls back on image error and recovers when uri changes", () => {
    const { getByTestId, UNSAFE_getAllByType, rerender } = render(
      <AvatarBannerPreview avatarUri="https://img/avatar.png" bannerUri="https://img/banner.png" />
    )

    const Image = require("react-native").Image
    let images = UNSAFE_getAllByType(Image)
    expect(images).toHaveLength(2)

    fireEvent(images[1], "error")
    fireEvent(images[0], "error")

    images = UNSAFE_getAllByType(Image)
    expect(images).toHaveLength(0)
    expect(getByTestId("avatar-banner-preview")).toBeTruthy()

    rerender(<AvatarBannerPreview avatarUri="https://img/avatar2.png" bannerUri="https://img/banner2.png" />)
    images = UNSAFE_getAllByType(Image)
    expect(images).toHaveLength(2)
  })
})
