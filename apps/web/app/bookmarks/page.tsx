"use client"

import type { PaginatedBookmarksResponse } from "@chordially/shared"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { BookmarkCard } from "../../components/bookmarks/BookmarkCard"
import { useAuth } from "../../lib/auth-context"
import { getBookmarks, removeBookmark } from "../../lib/bookmark-client"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; data: PaginatedBookmarksResponse }

export default function BookmarksPage() {
  const { token } = useAuth()
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    if (!token) return
    setState({ status: "loading" })
    try {
      const data = await getBookmarks(token, page, 20)
      setState({ status: "ok", data })
    } catch {
      setState({ status: "error", message: "Failed to load bookmarks." })
    }
  }, [token, page])

  useEffect(() => {
    load()
  }, [load])

  const handleRemove = useCallback(
    async (slug: string) => {
      if (!token) return
      try {
        await removeBookmark(slug, token)
        load()
      } catch {
        // silently fail
      }
    },
    [token, load]
  )

  if (!token) {
    return (
      <main style={mainStyle}>
        <h1 style={titleStyle}>Bookmarks</h1>
        <p style={emptyStyle}>Please log in to view your bookmarks.</p>
      </main>
    )
  }

  if (state.status === "loading") {
    return (
      <main style={mainStyle}>
        <h1 style={titleStyle}>Bookmarks</h1>
        <p style={emptyStyle}>Loading…</p>
      </main>
    )
  }

  if (state.status === "error") {
    return (
      <main style={mainStyle}>
        <h1 style={titleStyle}>Bookmarks</h1>
        <p style={errorStyle} role="alert">{state.message}</p>
      </main>
    )
  }

  const { bookmarks, total, hasMore } = state.data

  return (
    <main style={mainStyle}>
      <h1 style={titleStyle}>
        Bookmarks
        {total > 0 && <span style={countStyle}> ({total})</span>}
      </h1>

      {bookmarks.length === 0 ? (
        <p style={emptyStyle}>
          You haven&apos;t bookmarked any creators yet.{" "}
          <Link href="/discover">Discover creators</Link> to bookmark.
        </p>
      ) : (
        <>
          <div style={gridStyle}>
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {hasMore && (
            <div style={paginationStyle}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={pageButtonStyle}
              >
                Previous
              </button>
              <span style={pageInfoStyle}>Page {page}</span>
              <button
                type="button"
                disabled={!hasMore}
                onClick={() => setPage((p) => p + 1)}
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

const countStyle: React.CSSProperties = {
  fontWeight: 400,
  color: "#666",
  fontSize: 20,
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 16,
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
