import React from "react"
import { CREATOR_GENRES } from "@chordially/shared"

export interface DiscoveryEmptyStateProps {
  query?: string
  activeGenre?: string
  onResetFilters?: () => void
  onSuggestionClick?: (suggestion: string) => void
}

export function DiscoveryEmptyState({
  query = "",
  activeGenre = "",
  onResetFilters,
  onSuggestionClick,
}: DiscoveryEmptyStateProps) {
  const suggestions = CREATOR_GENRES

  return (
    <div
      className="discovery-empty-state"
      data-testid="discovery-empty-state"
      style={{
        padding: "2rem",
        textAlign: "center",
        background: "rgba(30, 41, 59, 0.5)",
        borderRadius: "0.75rem",
        border: "1px solid rgba(51, 65, 85, 0.6)",
        maxWidth: "28rem",
        margin: "1.5rem auto",
        color: "#e2e8f0",
      }}
    >
      <div style={{ fontSize: "2.25rem", marginBottom: "0.75rem" }}>🔍</div>
      <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
        No creators found
      </h3>
      <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "1rem" }}>
        {query ? `We couldn't find matches for "${query}"` : "No creators match your current filter settings."}
      </p>

      <div
        style={{
          background: "rgba(15, 23, 42, 0.6)",
          padding: "1rem",
          borderRadius: "0.5rem",
          textAlign: "left",
          fontSize: "0.75rem",
          color: "#cbd5e1",
          marginBottom: "1rem",
        }}
      >
        <p style={{ fontWeight: 600, color: "#e2e8f0", marginTop: 0 }}>Refining your search:</p>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#94a3b8" }}>
          <li>Check spelling or try broader terms</li>
          <li>Clear active genre or location filters</li>
          <li>Browse trending creators across all genres</li>
        </ul>
      </div>

      {suggestions.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem" }}>Try popular genres:</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.375rem" }}>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                data-testid={`suggestion-chip-${suggestion}`}
                onClick={() => onSuggestionClick?.(suggestion)}
                style={{
                  padding: "0.25rem 0.625rem",
                  background: "#334155",
                  color: "#e2e8f0",
                  fontSize: "0.75rem",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {onResetFilters && (
        <button
          type="button"
          data-testid="reset-filters-btn"
          onClick={onResetFilters}
          style={{
            padding: "0.5rem 1rem",
            background: "#4f46e5",
            color: "#fff",
            fontSize: "0.75rem",
            fontWeight: 600,
            borderRadius: "0.375rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Reset All Filters
        </button>
      )}
    </div>
  )
}
