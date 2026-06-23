export interface FanProfile {
  id: string
  userId: string
  displayName: string
  avatarUrl: string | null
  genrePrefs: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateFanProfileInput {
  userId: string
  displayName: string
}

export interface UpdateFanProfileInput {
  displayName?: string
  avatarUrl?: string | null
}

export interface FanProfileResponse {
  id: string
  userId: string
  displayName: string
  avatarUrl: string | null
  genrePrefs: string[]
  createdAt: string
  updatedAt: string
}

export function toFanResponse(profile: FanProfile): FanProfileResponse {
  return {
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    genrePrefs: profile.genrePrefs,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  }
}
