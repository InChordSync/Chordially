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
}

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
  }
}
