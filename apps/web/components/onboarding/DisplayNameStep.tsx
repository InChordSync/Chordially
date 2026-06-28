"use client"

import { useState } from "react"

interface DisplayNameStepProps {
  initialValue: string
  onSave: (value: string) => Promise<void>
}

export function DisplayNameStep({
  initialValue,
  onSave,
}: DisplayNameStepProps) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!value || value.length < 2) {
      setError("Display name must be at least 2 characters")
      return
    }
    setError(null)
    await onSave(value)
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Choose your display name</h2>
      <p style={{ color: "#555", marginBottom: "1rem" }}>
        This is how other users will see you on Chordially.
      </p>
      <div>
        <label htmlFor="displayName">Display Name</label>
        <input
          id="displayName"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Jane Doe"
        />
        {error && <p role="alert">{error}</p>}
      </div>
      <button type="button" onClick={handleSave}>
        Save & Continue
      </button>
    </div>
  )
}
