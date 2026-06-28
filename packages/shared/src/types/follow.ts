export interface FollowResponse {
  id: string
  followerId: string
  followingId: string
  createdAt: string
}

export interface FollowCountResponse {
  followers: number
  following: number
  creatorSlug: string
}

export interface FollowerEntry {
  id: string
  follower: {
    id: string
    displayName: string
    avatarUrl: string | null
  }
  createdAt: string
}

export interface FollowingEntry {
  id: string
  creator: {
    id: string
    displayName: string
    slug: string
    avatarUrl: string | null
    genre: string | null
  }
  createdAt: string
}

export interface PaginatedFollowersResponse {
  followers: FollowerEntry[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface PaginatedFollowingResponse {
  following: FollowingEntry[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
