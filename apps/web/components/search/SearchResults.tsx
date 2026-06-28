"use client"

import type { SearchResult } from "@chordially/shared"
import Link from "next/link"

interface SearchResultsProps {
  results: SearchResult[]
  highlightedIndex: number
}

export function SearchResults({
  results,
  highlightedIndex,
}: SearchResultsProps) {
  if (results.length === 0) {
    return <p style={emptyStyle}>No results found.</p>
  }

  return (
    <ul style={listStyle}>
      {results.map((result, index) => (
        <li
          key={result.id}
          style={{
            ...itemStyle,
            ...(index === highlightedIndex ? highlightedItemStyle : {}),
          }}
        >
          <Link href={`/creators/${result.slug}`} style={linkStyle}>
            <div style={cardStyle}>
              <div style={nameRowStyle}>
                <span style={nameStyle}>{result.displayName}</span>
              </div>
              {result.genre && (
                <span style={detailStyle}>Genre: {result.genre}</span>
              )}
              {result.location && (
                <span style={detailStyle}>Location: {result.location}</span>
              )}
              <span style={followerStyle}>
                {result.followerCount} follower
                {result.followerCount !== 1 ? "s" : ""}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

const listStyle: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
}

const itemStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
}

const highlightedItemStyle: React.CSSProperties = {
  background: "#f0f7ff",
}

const linkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  display: "block",
  padding: "12px 16px",
}

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
}

const nameRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
  alignItems: "center",
}

const nameStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 16,
}

const detailStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#555",
}

const followerStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#888",
}

const emptyStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#666",
  padding: 48,
}
