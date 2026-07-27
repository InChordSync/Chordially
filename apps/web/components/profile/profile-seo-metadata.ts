import type { Metadata } from "next"
import type { CreatorProfileResponse } from "@chordially/shared"

/**
 * Builds Next.js page `Metadata` for a creator's public profile page, so
 * search engines and link-preview crawlers see a real title/description
 * and OpenGraph image instead of generic app defaults.
 */
export function buildProfileMetadata(
  profile: CreatorProfileResponse
): Metadata {
  const description =
    profile.bio ?? `${profile.displayName} on Chordially.`

  return {
    title: `${profile.displayName} | Chordially`,
    description,
    openGraph: {
      title: profile.displayName,
      description,
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : undefined,
    },
  }
}
