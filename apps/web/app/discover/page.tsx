"use client"

import type { FormEvent } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { searchCreators, type CreatorSearchResult } from "../../lib/creator-client"
import {
  ProfileErrorState,
  ProfileSkeleton,
} from "../../components/profile/profile-skeleton"
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
  const [state, setState] = useState<SearchState>({ status: "idle" })

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocation(location)
    }, 300)
    return () => clearTimeout(handler)
  }, [location])

  async function search() {
    setState({ status: "loading" })
    try {
      const results = await searchCreators({
        genre: genre === "Any" ? undefined : genre,
        location: debouncedLocation || undefined,
        liveOnly,
      })
      setState({ status: "ok", results })
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to search creators",
      })
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state.status === "loading") return
    void search()
  }

  function handleRetry() {
    void search()
  }

  function handleResetFilters() {
    setGenre("Any")
    setLocation("")
    setDebouncedLocation("")
    setLiveOnly(false)
    setState({ status: "idle" })
  }

  function handleSuggestionClick(suggestion: string) {
    setGenre(suggestion)
  }

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

        <button type="submit">Search</button>
      </form>

      {state.status === "loading" && <ProfileSkeleton />}

      {state.status === "error" && (
        <ProfileErrorState message={state.message} onRetry={handleRetry} />
      )}

      {state.status === "ok" && state.results.length === 0 && (
        <DiscoveryEmptyState
          query={debouncedLocation}
          activeGenre={genre === "Any" ? "" : genre}
          onResetFilters={handleResetFilters}
          onSuggestionClick={handleSuggestionClick}
        />
      )}

      {state.status === "ok" && state.results.length > 0 && (
        <ul>
          {state.results.map((result) => (
            <li key={result.slug}>
              <Link href={`/creators/${result.slug}`}>
                {result.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.avatarUrl} alt="" width={40} height={40} />
                )}
                <span>{result.displayName}</span>
                <span>@{result.slug}</span>
                {result.followerCount !== undefined && (
                  <span>{result.followerCount} followers</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}