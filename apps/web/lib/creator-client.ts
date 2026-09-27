import type { CreatorProfileResponse } from "@chordially/shared"
import { apiFetch, authHeaders } from "./api-client"

export function getCreatorBySlug(
  slug: string
): Promise<CreatorProfileResponse> {
  return apiFetch<CreatorProfileResponse>(`/api/creators/${encodeURIComponent(slug)}`)
}

export interface CreatorSearchParams {
  genre?: string
  location?: string
  liveOnly?: boolean
}

export interface CreatorSearchResult {
  displayName: string
  slug: string
  avatarUrl?: string | null
  followerCount?: number
}

export function searchCreators(
  params: CreatorSearchParams,
  token?: string
): Promise<CreatorSearchResult[]> {
  const query = new URLSearchParams()
  if (params.genre) query.set("genre", params.genre)
  if (params.location) query.set("location", params.location)
  if (params.liveOnly) query.set("liveOnly", "true")

  const suffix = query.toString()
  const path = `/api/creators/search${suffix ? `?${suffix}` : ""}`

  return apiFetch<CreatorSearchResult[]>(path, {
    headers: token ? authHeaders(token) : undefined,
  })
}
