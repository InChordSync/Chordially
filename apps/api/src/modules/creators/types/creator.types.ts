export interface AvailabilitySlot {
  day: string
  slots: { start: string; end: string }[]
}

export interface CreatorProfile {
  id: string
  userId: string
  displayName: string
  slug: string
  bio: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  genre: string | null
  location: string | null
  tags: string[]
  activityScore: number
  lastActiveAt: Date | null
  availability: AvailabilitySlot[]
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
  bannerUrl?: string | null
  genre?: string
  location?: string
  tags?: string[]
  availability?: AvailabilitySlot[]
}

export interface CreatorResponse {
  id: string
  userId: string
  displayName: string
  slug: string
  bio: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  coverUrl: string | null
  genre: string | null
  location: string | null
  tags: string[]
  activityScore: number
  lastActiveAt: string | null
  availability: AvailabilitySlot[]
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatorCardResponse {
  id: string
  slug: string
  displayName: string
  avatarUrl: string | null
  genre: string | null
  location: string | null
  tags: string[]
  isVerified: boolean
  followerCount: number
  isFollowing?: boolean
  isBookmarked?: boolean
}

export function toCreatorCardResponse(
  profile: CreatorProfile,
  followerCount: number,
  isFollowing?: boolean,
  isBookmarked?: boolean
): CreatorCardResponse {
  return {
    id: profile.id,
    slug: profile.slug,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    genre: profile.genre,
    location: profile.location,
    tags: profile.tags,
    isVerified: profile.isVerified,
    followerCount,
    isFollowing,
    isBookmarked,
  }
}

export function toCreatorResponse(
  profile: CreatorProfile,
  coverUrl: string | null = null
): CreatorResponse {
  return {
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    slug: profile.slug,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    bannerUrl: profile.bannerUrl,
    coverUrl,
    genre: profile.genre,
    location: profile.location,
    tags: profile.tags,
    activityScore: profile.activityScore,
    lastActiveAt: profile.lastActiveAt?.toISOString() ?? null,
    availability: profile.availability,
    isVerified: profile.isVerified,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  }
}
