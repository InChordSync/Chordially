export interface DiscoveryCreator {
  id: string
  userId: string
  displayName: string
  slug: string
  bio: string | null
  avatarUrl: string | null
  genre: string | null
  location: string | null
  tags: string[]
  activityScore: number
  followerCount: number
  isVerified: boolean
  createdAt: string
}

export interface DiscoveryPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface DiscoveryResponse {
  creators: DiscoveryCreator[]
  pagination: DiscoveryPagination
}

export interface DiscoveryFilters {
  genre?: string
  location?: string
  sort?: "freshness" | "activity" | "followers"
  page: number
  limit: number
}
