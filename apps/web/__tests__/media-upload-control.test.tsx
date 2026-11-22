import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MediaUploadControl,
} from "../components/profile/media-upload-control"

describe("MediaUploadControl (#1384)", () => {
  it("accepts allowed image types and calls onFileValid", () => {
    const onFileValid = vi.fn()
    render(<MediaUploadControl onFileValid={onFileValid} />)

    const input = screen.getByRole("textbox", { hidden: true }) as HTMLInputElement | null
    const fileInput = (input ?? document.querySelector('input[type="file"]')) as HTMLInputElement
    const file = new File(["ok"], "ok.png", { type: "image/png" })

    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(onFileValid).toHaveBeenCalledWith(file)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("rejects unsupported file type and does not call onFileValid", () => {
    const onFileValid = vi.fn()
    render(<MediaUploadControl onFileValid={onFileValid} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["gif"], "bad.gif", { type: "image/gif" })

    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(onFileValid).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent(/JPEG, PNG, or WebP/i)
  })

  it("rejects oversize files and does not call onFileValid", () => {
    const onFileValid = vi.fn()
    render(<MediaUploadControl onFileValid={onFileValid} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const oversized = new File([new Uint8Array(MAX_IMAGE_SIZE_BYTES + 1)], "big.png", { type: "image/png" })

    fireEvent.change(fileInput, { target: { files: [oversized] } })

    expect(onFileValid).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent(/smaller than 5 MB/i)
  })

  it("exports API-aligned constants", () => {
    expect(ALLOWED_IMAGE_TYPES).toEqual(["image/jpeg", "image/png", "image/webp"])
    expect(MAX_IMAGE_SIZE_BYTES).toBe(5 * 1024 * 1024)
  })
})
