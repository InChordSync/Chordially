import type { CreatorProfileResponse } from "@chordially/shared"

export interface CreatorProfile {
  id: string
  userId: string
  displayName: string
  slug: string
  bio: string | null
  avatarUrl: string | null
  genre: string | null
  location: string | null
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateCreatorInput {
  userId: string
  displayName: string
  bio?: string
  genre?: string
  location?: string
}

export interface UpdateCreatorInput {
  displayName?: string
  bio?: string | null
  avatarUrl?: string | null
  genre?: string
  location?: string
}

export interface CreatorResponse extends CreatorProfileResponse {
  id: string
  userId: string
  displayName: string
  slug: string
  bio: string | null
  avatarUrl: string | null
  genre: string | null
  location: string | null
  isVerified: boolean
  followerCount: number
  trackCount: number
  createdAt: string
  updatedAt: string
  /** See the stubbing note on {@link toCreatorResponse} below (N-036). */
  followerCount: number
  /** See the stubbing note on {@link toCreatorResponse} below (N-036). */
  trackCount: number
}

/**
 * N-036 decision: `@chordially/shared`'s `CreatorProfileResponse` has had
 * `followerCount`/`trackCount` fields for a while, but no `Follow` (or
 * track) model exists in `schema.prisma` yet, and building one is a
 * separate, larger effort (join table, migration, and count-maintenance
 * on every follow/unfollow — see `types/follow-graph.types.ts`'s
 * `FollowCounts` helpers, which already assume such a table exists but
 * have nothing backing them in the database).
 *
 * Decision: leave both stubbed at 0 explicitly here, rather than
 * implementing a minimal join table as part of this single-file change.
 * Follow-up: wire real counts once a `Follow` model (and a tracks/streams
 * model, for `trackCount`) lands — cross-reference N-036 on the issue
 * tracker.
 */
const STUBBED_FOLLOWER_COUNT = 0
const STUBBED_TRACK_COUNT = 0

export function toCreatorResponse(profile: CreatorProfile): CreatorResponse {
  return {
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    slug: profile.slug,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    genre: profile.genre,
    location: profile.location,
    isVerified: profile.isVerified,
    followerCount: 0,
    trackCount: 0,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    followerCount: STUBBED_FOLLOWER_COUNT,
    trackCount: STUBBED_TRACK_COUNT,
  }
}
