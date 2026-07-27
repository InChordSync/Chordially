"use client"

import { useState } from "react"

const GENRES = ["Any", "Hip-Hop", "Pop", "Electronic", "Rock", "Jazz"]

export default function DiscoverPage() {
  const [genre, setGenre] = useState("Any")
  const [location, setLocation] = useState("")
  const [liveOnly, setLiveOnly] = useState(false)

  return (
    <main>
      <h1>Discover creators</h1>
      <form>
        <label>
          Genre
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label>
          Location
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or country"
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={liveOnly}
            onChange={(e) => setLiveOnly(e.target.checked)}
          />
          Live now only
        </label>
      </form>
    </main>
  )
}
