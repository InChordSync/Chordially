import { render, screen, fireEvent } from "@testing-library/react-native"
import { act } from "react"
import ProfileImagePicker from "../src/components/ProfileImagePicker"

const mockRequestPermissions = jest.fn()
const mockLaunchLibrary = jest.fn()

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: (...args: unknown[]) =>
    mockRequestPermissions(...args),
  launchImageLibraryAsync: (...args: unknown[]) =>
    mockLaunchLibrary(...args),
}))

const onImagePicked = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

describe("ProfileImagePicker", () => {
  it("renders the placeholder when no avatar is provided", () => {
    render(
      <ProfileImagePicker
        currentAvatarUrl={null}
        onImagePicked={onImagePicked}
      />
    )
    expect(screen.getByText("+")).toBeTruthy()
    expect(screen.getByText("Tap to change photo")).toBeTruthy()
  })

  it("renders the current avatar when provided", () => {
    render(
      <ProfileImagePicker
        currentAvatarUrl="https://example.com/avatar.jpg"
        onImagePicked={onImagePicked}
      />
    )
    expect(screen.getByLabelText("Profile avatar")).toBeTruthy()
  })

  it("shows permission error when denied", async () => {
    mockRequestPermissions.mockResolvedValue({ granted: false })

    render(
      <ProfileImagePicker
        currentAvatarUrl={null}
        onImagePicked={onImagePicked}
      />
    )

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Pick profile image"))
    })

    expect(
      screen.getByText("Permission to access photos was denied")
    ).toBeTruthy()
    expect(mockLaunchLibrary).not.toHaveBeenCalled()
  })

  it("calls onImagePicked after a successful pick", async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true })
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///photo.jpg", mimeType: "image/jpeg" }],
    })

    render(
      <ProfileImagePicker
        currentAvatarUrl={null}
        onImagePicked={onImagePicked}
      />
    )

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Pick profile image"))
    })

    expect(onImagePicked).toHaveBeenCalledWith(
      "file:///photo.jpg",
      "image/jpeg"
    )
  })

  it("does nothing when the user cancels the picker", async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true })
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: [] })

    render(
      <ProfileImagePicker
        currentAvatarUrl={null}
        onImagePicked={onImagePicked}
      />
    )

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Pick profile image"))
    })

    expect(onImagePicked).not.toHaveBeenCalled()
  })
})
