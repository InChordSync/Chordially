"use client"

import { useRef, useState } from "react"

interface MediaUploadButtonProps {
  onUpload: (file: File) => Promise<void>
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 10 * 1024 * 1024

export function MediaUploadButton({ onUpload }: MediaUploadButtonProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed")
      return
    }

    if (file.size > MAX_SIZE) {
      setError("File must be under 10MB")
      return
    }

    setUploading(true)
    try {
      await onUpload(file)
    } catch {
      setError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        style={{ display: "none" }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Add Media"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
