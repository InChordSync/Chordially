export interface CreatorProfileResponse {
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
