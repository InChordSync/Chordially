import type { CreatorProfileResponse } from "./creator.js"

/**
 * Minimal, display-ready contract for a creator card on discovery surfaces
 * (search results, trending feed, discover grid).
 */
export interface CreatorCardData {
  id: string
  displayName: string
  slug: string
  avatarUrl: string | null
  genre: string | null
  location: string | null
  isVerified: boolean
}

export function toCreatorCard(
  profile: CreatorProfileResponse
): CreatorCardData {
  return {
    id: profile.id,
    displayName: profile.displayName,
    slug: profile.slug,
    avatarUrl: profile.avatarUrl,
    genre: profile.genre,
    location: profile.location,
    isVerified: profile.isVerified,
  }
}
