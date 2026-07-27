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
    genre: profile.genre,
    location: profile.location,
    isVerified: profile.isVerified,
    searchText,
  }
}
