export interface AvailabilityWindow {
  day: string
  slots: { start: string; end: string }[]
}

export interface CreatorProfileResponse {
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
  availability: AvailabilityWindow[]
  isVerified: boolean
  followerCount: number
  trackCount: number
  createdAt: string
  updatedAt: string
}

export interface CreatorCardResponse {
  id: string
  displayName: string
  slug: string
  avatarUrl: string | null
  genre: string | null
  isVerified: boolean
  followerCount: number
  trackCount: number
}
