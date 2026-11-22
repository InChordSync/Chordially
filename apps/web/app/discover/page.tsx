"use client"

import { CREATOR_GENRES } from "@chordially/shared"
import { useEffect, useState } from "react"
import { DiscoveryEmptyState } from "../../components/DiscoveryEmptyState"
import { searchCreators, type CreatorSearchResult } from "../../lib/creator-client"

const GENRES = ["Any", ...CREATOR_GENRES]

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
  const [searchState, setSearchState] = useState<SearchState>({ status: "idle" })
  const [searchVersion, setSearchVersion] = useState(0)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocation(location)
    }, 300)
    return () => clearTimeout(handler)
  }, [location])

  useEffect(() => {
    if (searchVersion === 0) return

    const controller = new AbortController()
    let active = true
    setSearchState({ status: "loading" })

    const activeGenre = genre === "Any" ? undefined : genre
    searchCreators(
      {
        genre: activeGenre,
        location: debouncedLocation.trim() || undefined,
        liveOnly: liveOnly || undefined,
      },
      undefined,
      controller.signal
    )
      .then((results) => {
        if (!active || controller.signal.aborted) return
        setSearchState({ status: "ok", results })
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) return
        if (error instanceof DOMException && error.name === "AbortError") return
        setSearchState({
          status: "error",
          message: error instanceof Error ? error.message : "Failed to search creators",
        })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [debouncedLocation, genre, liveOnly, searchVersion])

  function applyFilters() {
    setSearchVersion((v) => v + 1)
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
    setSearchState({ status: "idle" })
    setSearchVersion(0)
  }

  function handleSuggestionClick(suggestion: string) {
    setGenre(suggestion)
    setSearchVersion((v) => v + 1)
  }

  const activeGenre = genre === "Any" ? "" : genre
  const results = searchState.status === "ok" ? searchState.results : []

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

      {searchState.status === "loading" && <p role="status">Loading creators…</p>}

      {searchState.status === "error" && (
        <div role="alert">
          <p>{searchState.message}</p>
          <button type="button" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {searchState.status === "ok" && results.length === 0 && (
        <DiscoveryEmptyState
          query={debouncedLocation}
          activeGenre={activeGenre}
          onResetFilters={handleResetFilters}
          onSuggestionClick={handleSuggestionClick}
        />
      )}

      {searchState.status === "ok" && results.length > 0 && (
        <ul>
          {results.map((creator) => (
            <li key={creator.slug}>
              <span>{creator.displayName}</span>
              {typeof creator.followerCount === "number" && (
                <span> - {creator.followerCount} followers</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
