"use client"

import { useState } from "react"

interface LocationStepProps {
  initialValue: string
  onSave: (value: string) => Promise<void>
  onComplete: () => void
}

export function LocationStep({
  initialValue,
  onSave,
  onComplete,
}: LocationStepProps) {
  const [value, setValue] = useState(initialValue ?? "")
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (value.length > 100) {
      setError("Location must be at most 100 characters")
      return
    }
    setError(null)
    await onSave(value)
    onComplete()
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Add your location</h2>
      <p style={{ color: "#555", marginBottom: "1rem" }}>
        Let people know where you&apos;re based.
      </p>
      <div>
        <label htmlFor="location">Location</label>
        <input
          id="location"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. New York, NY"
        />
        {error && <p role="alert">{error}</p>}
      </div>
      <button type="button" onClick={handleSave}>
        Save & Complete
      </button>
    </div>
  )
}
