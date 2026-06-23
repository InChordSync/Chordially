export interface FanProfileResponse {
  id: string
  userId: string
  displayName: string
  avatarUrl: string | null
  genrePrefs: string[]
  createdAt: string
  updatedAt: string
}
