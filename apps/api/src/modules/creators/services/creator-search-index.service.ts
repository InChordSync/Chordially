import type { CreatorResponse } from "../types/creator.types.js"

/**
 * Flat, index-friendly document derived from a creator profile. Kept as a
 * pure mapping so any search backend (Postgres full-text, Meilisearch,
 * Algolia, ...) can consume it identically.
 */
export interface CreatorSearchDocument {
  id: string
  displayName: string
  slug: string
  avatarUrl: string | null
  genre: string | null
  location: string | null
  isVerified: boolean
  searchText: string
}

export function toSearchDocument(
  profile: CreatorResponse
): CreatorSearchDocument {
  const searchText = [profile.displayName, profile.genre, profile.location]
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .toLowerCase()

  return {
    id: profile.id,
    displayName: profile.displayName,
    slug: profile.slug,
    avatarUrl: profile.avatarUrl,
    genre: profile.genre,
    location: profile.location,
    isVerified: profile.isVerified,
    searchText,
  }
}

/** Web-client-friendly search result for GET /api/creators/search. */
export interface CreatorSearchResult {
  displayName: string
  slug: string
  avatarUrl: string | null
  followerCount: number
}

function rankScore(doc: CreatorSearchDocument, needle: string): number {
  const displayName = doc.displayName.toLowerCase()
  if (displayName === needle || doc.slug === needle) return 3
  if (displayName.startsWith(needle)) return 2
  return 1
}

/**
 * Filters candidates by the free-text query (case-insensitive, matched
 * against the lowercased displayName/genre/location index) and ranks the
 * survivors: exact slug/name > name prefix > substring. There is no
 * follower model yet, so followerCount defaults to 0 rather than being
 * derived from a relation that doesn't exist.
 */
export function searchCreatorProfiles(
  profiles: CreatorResponse[],
  q?: string
): CreatorSearchResult[] {
  const needle = q?.trim().toLowerCase()

  const docs = q
    ? profiles.map(toSearchDocument).filter((doc) => doc.searchText.includes(needle!))
    : profiles.map(toSearchDocument)

  const ranked = docs
    .map((doc) => ({ doc, score: needle ? rankScore(doc, needle) : 0 }))
    .sort(
      (a, b) =>
        b.score - a.score || a.doc.displayName.localeCompare(b.doc.displayName)
    )

  return ranked.map(({ doc }) => ({
    displayName: doc.displayName,
    slug: doc.slug,
    avatarUrl: doc.avatarUrl,
    followerCount: 0,
  }))
}