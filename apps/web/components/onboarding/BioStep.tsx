"use client"

import { useState } from "react"

interface BioStepProps {
  initialValue: string
  onSave: (value: string) => Promise<void>
}

export function BioStep({ initialValue, onSave }: BioStepProps) {
  const [value, setValue] = useState(initialValue ?? "")
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (value.length > 300) {
      setError("Bio must be at most 300 characters")
      return
    }
    setError(null)
    await onSave(value)
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Write your bio</h2>
      <p style={{ color: "#555", marginBottom: "1rem" }}>
        Tell people about yourself and your music.
      </p>
      <div>
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Share a bit about yourself..."
          style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
        />
        <p style={{ fontSize: "0.8rem", color: "#888", textAlign: "right" }}>
          {value.length}/300
        </p>
        {error && <p role="alert">{error}</p>}
      </div>
      <button type="button" onClick={handleSave}>
        Save & Continue
      </button>
    </div>
  )
}
