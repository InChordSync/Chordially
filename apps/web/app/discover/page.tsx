"use client"

import { useEffect, useState } from "react"
import { DiscoveryEmptyState } from "../../src/components/DiscoveryEmptyState"

const GENRES = ["Any", "Hip-Hop", "Pop", "Electronic", "Rock", "Jazz"]

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; results: CreatorSearchResult[] }

export default function DiscoverPage() {
  const [genre, setGenre] = useState("Any")
  const [location, setLocation] = useState("")
  const [liveOnly, setLiveOnly] = useState(false)
  const [debouncedLocation, setDebouncedLocation] = useState("")
  const [results, setResults] = useState<string[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocation(location)
    }, 300)
    return () => clearTimeout(handler)
  }, [location])

  function applyFilters() {
    setError(null)
    setResults([])
    setHasSearched(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    applyFilters()
  }

  function handleRetry() {
    applyFilters()
  }

  function handleResetFilters() {
    setGenre("Any")
    setLocation("")
    setDebouncedLocation("")
    setLiveOnly(false)
    setResults([])
    setHasSearched(false)
    setError(null)
  }

  function handleSuggestionClick(suggestion: string) {
    setGenre(suggestion)
  }

  const activeGenre = genre === "Any" ? "" : genre

  return (
    <main>
      <h1>Discover creators</h1>
      <form onSubmit={handleSubmit}>
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

        <button type="submit">Apply</button>
      </form>

      {error && (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {!error && hasSearched && results.length === 0 && (
        <DiscoveryEmptyState
          query={debouncedLocation}
          activeGenre={activeGenre}
          onResetFilters={handleResetFilters}
          onSuggestionClick={handleSuggestionClick}
        />
      )}
    </main>
  )
}