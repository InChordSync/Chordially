"use client"

import { useState, useRef } from "react"

interface AvatarStepProps {
  currentAvatarUrl: string | null
  onSave: (url: string) => Promise<void>
}

export function AvatarStep({ currentAvatarUrl, onSave }: AvatarStepProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB")
      return
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed")
      return
    }

    setError(null)
    setUploading(true)

    try {
      const dataUrl = URL.createObjectURL(file)
      setPreview(dataUrl)
      await onSave(dataUrl)
    } catch {
      setError("Failed to upload avatar")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Upload a profile photo</h2>
      <p style={{ color: "#555", marginBottom: "1rem" }}>
        Add a photo so people can recognize you.
      </p>

      <div style={{ marginBottom: "1rem" }}>
        {preview ? (
          <img
            src={preview}
            alt="Avatar preview"
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "#ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#888",
              fontSize: "0.875rem",
            }}
          >
            No photo
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : currentAvatarUrl ? "Change Photo" : "Choose Photo"}
      </button>

      {currentAvatarUrl && (
        <button
          type="button"
          onClick={() => {
            setPreview(null)
            onSave("")
          }}
          style={{ marginLeft: "0.5rem" }}
        >
          Remove
        </button>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  )
}
