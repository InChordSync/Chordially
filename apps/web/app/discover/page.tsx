"use client"

import type { DiscoveryFilters, DiscoveryResponse } from "@chordially/shared"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "../../lib/auth-context"
import { discoverCreators } from "../../lib/discover-client"
import { CreatorCard } from "../../components/discover/CreatorCard"
import { DiscoverFilters } from "../../components/discover/DiscoverFilters"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; data: DiscoveryResponse }

const PAGE_SIZE = 12

export default function DiscoverPage() {
  const { token } = useAuth()

  const [filters, setFilters] = useState<DiscoveryFilters>({
    page: 1,
    limit: PAGE_SIZE,
  })

  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [searchKey, setSearchKey] = useState(0)

  const load = useCallback(async () => {
    setState({ status: "loading" })
    try {
      const data = await discoverCreators(filters, token)
      setState({ status: "ok", data })
    } catch {
      setState({ status: "error", message: "Failed to load creators. Please try again." })
    }
  }, [filters, token])

  useEffect(() => {
    load()
  }, [load, searchKey])

  const totalPages = useMemo(
    () => (state.status === "ok" ? Math.ceil(state.data.pagination.total / PAGE_SIZE) : 1),
    [state]
  )

  const handleFilterChange = useCallback((next: DiscoveryFilters) => {
    setFilters({ ...next, page: 1 })
    setSearchKey((k) => k + 1)
  }, [])

  const goToPage = useCallback(
    (page: number) => {
      setFilters((prev) => ({ ...prev, page }))
      setSearchKey((k) => k + 1)
    },
    []
  )

  return (
    <main style={mainStyle}>
      <h1 style={titleStyle}>Discover Creators</h1>

      <DiscoverFilters filters={filters} onChange={handleFilterChange} />

      {state.status === "loading" && <p style={statusTextStyle}>Loading creators…</p>}

      {state.status === "error" && (
        <div style={errorBoxStyle}>
          <p>{state.message}</p>
          <button type="button" onClick={() => setSearchKey((k) => k + 1)} style={retryButtonStyle}>
            Retry
          </button>
        </div>
      )}

      {state.status === "ok" && state.data.creators.length === 0 && (
        <p style={statusTextStyle}>No creators found. Try adjusting your filters.</p>
      )}

      {state.status === "ok" && state.data.creators.length > 0 && (
        <>
          <div style={gridStyle}>
            {state.data.creators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={paginationStyle}>
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() => goToPage(filters.page - 1)}
                style={pageButtonStyle}
              >
                Previous
              </button>
              <span style={pageInfoStyle}>
                Page {filters.page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={filters.page >= totalPages}
                onClick={() => goToPage(filters.page + 1)}
                style={pageButtonStyle}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}

const mainStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  padding: "24px 16px",
}

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  marginBottom: 24,
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 16,
}

const statusTextStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#666",
  padding: 48,
}

const errorBoxStyle: React.CSSProperties = {
  textAlign: "center",
  padding: 48,
  color: "#c0392b",
}

const retryButtonStyle: React.CSSProperties = {
  marginTop: 12,
  padding: "8px 20px",
  borderRadius: 6,
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer",
  fontSize: 14,
}

const paginationStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 16,
  marginTop: 32,
}

const pageButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 6,
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer",
  fontSize: 14,
}

const pageInfoStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#555",
}
