"use client"

import { useState, type ChangeEvent } from "react"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024

interface MediaUploadControlProps {
  onFileValid: (file: File) => void
}

function hasAllowedExtension(name: string): boolean {
  const lower = name.toLowerCase()
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/** Validates a media file's type/size client-side before it is uploaded. */
export function MediaUploadControl({ onFileValid }: MediaUploadControlProps) {
  const [error, setError] = useState<string | null>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Allow re-selecting the same file (#1369)
    event.target.value = ""

    if (!file) return

    const typeAllowed = ALLOWED_TYPES.includes(file.type) || (!file.type && hasAllowedExtension(file.name))
    const extensionAllowed = hasAllowedExtension(file.name)
    if (!typeAllowed && !extensionAllowed) {
      setError("Please choose a JPEG, PNG, or WebP image")
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError("Image must be smaller than 5 MB")
      return
    }

    setError(null)
    onFileValid(file)
  }

  return (
    <div>
      <input type="file" accept={ALLOWED_TYPES.join(",")} onChange={handleChange} />
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
