export interface SearchResult {
  id: string
  creatorId: string
  displayName: string
  slug: string
  bio: string | null
  genre: string | null
  location: string | null
  tags: string[]
  activityScore: number
  followerCount: number
  indexedAt: string
}

export interface SearchPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface SearchResponse {
  results: SearchResult[]
  pagination: SearchPagination
}

export interface SearchFilters {
  q: string
  genre?: string
  location?: string
  page: number
  limit: number
}
