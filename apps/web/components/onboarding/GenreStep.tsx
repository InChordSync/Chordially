"use client"

import { useState } from "react"

interface GenreStepProps {
  initialValue: string
  onSave: (value: string) => Promise<void>
}

export function GenreStep({ initialValue, onSave }: GenreStepProps) {
  const [value, setValue] = useState(initialValue ?? "")
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (value.length > 50) {
      setError("Genre must be at most 50 characters")
      return
    }
    setError(null)
    await onSave(value)
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Set your genre</h2>
      <p style={{ color: "#555", marginBottom: "1rem" }}>
        What genre best describes your music?
      </p>
      <div>
        <label htmlFor="genre">Genre</label>
        <input
          id="genre"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Jazz, Hip Hop, Classical"
        />
        {error && <p role="alert">{error}</p>}
      </div>
      <button type="button" onClick={handleSave}>
        Save & Continue
      </button>
    </div>
  )
}
