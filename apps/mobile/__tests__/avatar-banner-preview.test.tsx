import React from "react"
import { fireEvent, render } from "@testing-library/react-native"
import { Image } from "react-native"
import AvatarBannerPreview from "../src/components/AvatarBannerPreview"

describe("AvatarBannerPreview (#1425)", () => {
  it("resets error flags when URI changes after a failed image", () => {
    const { UNSAFE_getAllByType, rerender, getByTestId } = render(
      <AvatarBannerPreview avatarUri="https://img/a.png" bannerUri="https://img/b.png" />
    )

    let images = UNSAFE_getAllByType(Image)
    expect(images).toHaveLength(2)

    fireEvent(images[0], "error")
    fireEvent(images[1], "error")

    images = UNSAFE_getAllByType(Image)
    expect(images).toHaveLength(0)
    expect(getByTestId("avatar-banner-preview")).toBeTruthy()

    rerender(<AvatarBannerPreview avatarUri="https://img/a2.png" bannerUri="https://img/b2.png" />)
    images = UNSAFE_getAllByType(Image)
    expect(images).toHaveLength(2)
  })
})
