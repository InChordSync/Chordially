import type {
  CreatorCardResponse,
  CreatorProfileResponse,
  FollowCountResponse,
  FollowResponse,
} from "@chordially/shared"
import { apiFetch, authHeaders } from "./api-client"

export function getCreatorBySlug(
  slug: string
): Promise<CreatorProfileResponse> {
  return apiFetch<CreatorProfileResponse>(
    `/api/creators/${encodeURIComponent(slug)}`
  )
}

export function getCreatorCard(
  slug: string,
  token?: string | null
): Promise<CreatorCardResponse> {
  const headers: Record<string, string> = {}
  if (token) {
    Object.assign(headers, authHeaders(token))
  }
  return apiFetch<CreatorCardResponse>(
    `/api/creators/card/${encodeURIComponent(slug)}`,
    { headers }
  )
}

export function getCreatorFollowCount(
  slug: string,
  token?: string | null
): Promise<FollowCountResponse> {
  const headers: Record<string, string> = {}
  if (token) {
    Object.assign(headers, authHeaders(token))
  }
  return apiFetch<FollowCountResponse>(
    `/api/creators/${encodeURIComponent(slug)}/follows/count`,
    { headers }
  )
}

export function followCreator(
  slug: string,
  token: string
): Promise<FollowResponse> {
  return apiFetch<FollowResponse>(
    `/api/creators/${encodeURIComponent(slug)}/follow`,
    {
      method: "POST",
      headers: authHeaders(token),
    }
  )
}

export function unfollowCreator(
  slug: string,
  token: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(
    `/api/creators/${encodeURIComponent(slug)}/follow`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    }
  )
}
