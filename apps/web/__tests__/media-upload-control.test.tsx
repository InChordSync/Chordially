import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { MediaUploadControl } from "../components/profile/media-upload-control"

describe("MediaUploadControl", () => {
  it("associates input with label and exposes errors accessibly (#1368)", async () => {
    const user = userEvent.setup()
    const onFileValid = vi.fn()
    render(
      <div>
        <label htmlFor="avatar-upload">Profile Photo</label>
        <MediaUploadControl id="avatar-upload" onFileValid={onFileValid} />
      </div>
    )

    const input = screen.getByLabelText(/profile photo/i)
    const badFile = new File(["x"], "photo.txt", { type: "text/plain" })
    await user.upload(input, badFile)

    expect(screen.getByRole("alert")).toHaveTextContent(/jpeg, png, or webp/i)
    expect(input).toHaveAttribute("aria-invalid", "true")
  })
})
