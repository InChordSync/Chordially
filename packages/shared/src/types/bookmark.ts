export interface BookmarkEntry {
  id: string
  creator: {
    id: string
    displayName: string
    slug: string
    avatarUrl: string | null
    genre: string | null
    location: string | null
    isVerified: boolean
  }
  createdAt: string
}

export interface PaginatedBookmarksResponse {
  bookmarks: BookmarkEntry[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
