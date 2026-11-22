import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { MediaUploadControl } from "../components/profile/media-upload-control"

describe("MediaUploadControl", () => {
  it("allows re-selecting the same file after validation failure (#1369)", async () => {
    const user = userEvent.setup()
    const onFileValid = vi.fn()
    render(<MediaUploadControl onFileValid={onFileValid} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], "photo.png", { type: "image/png" })

    await user.upload(input, bigFile)
    expect(screen.getByRole("alert")).toHaveTextContent(/smaller than 5 mb/i)
    expect(onFileValid).not.toHaveBeenCalled()

    // Same file again - should trigger change because input value was reset
    await user.upload(input, bigFile)
    expect(screen.getByRole("alert")).toHaveTextContent(/smaller than 5 mb/i)
  })

  it("accepts file by extension fallback when type is empty (#1369)", async () => {
    const user = userEvent.setup()
    const onFileValid = vi.fn()
    render(<MediaUploadControl onFileValid={onFileValid} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["img"], "photo.webp", { type: "" })
    await user.upload(input, file)

    expect(onFileValid).toHaveBeenCalledWith(file)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})
