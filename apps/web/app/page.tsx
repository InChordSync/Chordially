"use client"

import type { BookmarkEntry, DiscoveryCreator } from "@chordially/shared"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { SpotlightRow } from "../components/home/SpotlightRow"
import { useAuth } from "../lib/auth-context"
import { getBookmarks } from "../lib/bookmark-client"
import { BookmarkCard } from "../components/bookmarks/BookmarkCard"

export default function HomePage() {
  const { user, token, isLoading, logout } = useAuth()
  const [spotlightCreators, setSpotlightCreators] = useState<DiscoveryCreator[]>([])
  const [spotlightError, setSpotlightError] = useState(false)
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([])
  const [bookmarksError, setBookmarksError] = useState(false)

  const load = useCallback(async () => {
    if (!token) return

    try {
      const discoverRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/discover?limit=6&sort=activity`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (discoverRes.ok) {
        const data = await discoverRes.json()
        setSpotlightCreators(data.creators ?? [])
      } else {
        setSpotlightError(true)
      }
    } catch {
      setSpotlightError(true)
    }

    try {
      const data = await getBookmarks(token, 1, 5)
      setBookmarks(data.bookmarks)
    } catch {
      setBookmarksError(true)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  if (isLoading) {
    return (
      <main>
        <p>Loading...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main>
        <h1>Chordially</h1>
        <p>
          <Link href="/login">Log in</Link> or{" "}
          <Link href="/register">create an account</Link> to get started.
        </p>
      </main>
    )
  }

  return (
    <main>
      <h1>Chordially</h1>
      <p>Welcome back, {user.email}!</p>
      <button type="button" onClick={logout}>
        Log out
      </button>

      {spotlightError ? (
        <p style={{ color: "#c0392b" }}>Failed to load featured creators.</p>
      ) : (
        <SpotlightRow creators={spotlightCreators} />
      )}

      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Bookmarked Creators</h2>
          <Link href="/bookmarks" style={{ fontSize: 14, color: "#1d9bf0" }}>View all</Link>
        </div>
        {bookmarksError ? (
          <p style={{ color: "#c0392b" }}>Failed to load bookmarks.</p>
        ) : bookmarks.length === 0 ? (
          <p style={{ color: "#666" }}>
            You haven&apos;t bookmarked any creators yet.{" "}
            <Link href="/discover">Discover creators</Link> to bookmark.
          </p>
        ) : (
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
            {bookmarks.map((b) => (
              <BookmarkCard key={b.id} bookmark={b} onRemove={() => load()} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
