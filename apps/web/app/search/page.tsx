"use client"

import type { SearchResponse } from "@chordially/shared"
import { useCallback, useState } from "react"
import { searchApi } from "../../lib/search-client"
import { SearchInput } from "../../components/search/SearchInput"
import { SearchResults } from "../../components/search/SearchResults"

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; data: SearchResponse }

export default function SearchPage() {
  const [state, setState] = useState<LoadState>({ status: "idle" })
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [currentResults, setCurrentResults] = useState<SearchResponse["results"]>([])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState({ status: "idle" })
      setCurrentResults([])
      return
    }

    setState({ status: "loading" })

    try {
      const data = await searchApi({ q: query, page: 1, limit: 20 })
      setState({ status: "ok", data })
      setCurrentResults(data.results)
      setHighlightedIndex(-1)
    } catch {
      setState({ status: "error", message: "Search failed. Please try again." })
    }
  }, [])

  const handleKeyNav = useCallback((direction: "up" | "down") => {
    setHighlightedIndex((prev) => {
      const max = currentResults.length - 1
      if (direction === "down") {
        return prev < max ? prev + 1 : 0
      }
      return prev > 0 ? prev - 1 : max
    })
  }, [currentResults.length])

  const handleSelect = useCallback(() => {
    if (highlightedIndex >= 0 && highlightedIndex < currentResults.length) {
      const slug = currentResults[highlightedIndex].slug
      window.location.href = `/creators/${slug}`
    }
  }, [highlightedIndex, currentResults])

  const handleEscape = useCallback(() => {
    setHighlightedIndex(-1)
  }, [])

  const isSearching = state.status === "loading"

  return (
    <main style={mainStyle}>
      <h1 style={titleStyle}>Search Creators</h1>

      <SearchInput
        onSearch={handleSearch}
        onKeyNav={handleKeyNav}
        onSelect={handleSelect}
        onEscape={handleEscape}
        isSearching={isSearching}
      />

      {state.status === "idle" && (
        <p style={emptyStyle}>Start typing to search for creators.</p>
      )}

      {state.status === "loading" && (
        <p style={emptyStyle}>Searching…</p>
      )}

      {state.status === "error" && (
        <p style={errorStyle} role="alert">{state.message}</p>
      )}

      {state.status === "ok" && (
        <SearchResults
          results={state.data.results}
          highlightedIndex={highlightedIndex}
        />
      )}
    </main>
  )
}

const mainStyle: React.CSSProperties = {
  maxWidth: 640,
  margin: "0 auto",
  padding: "24px 16px",
}

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  marginBottom: 24,
}

const emptyStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#666",
  padding: 48,
}

const errorStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#c0392b",
  padding: 48,
}
