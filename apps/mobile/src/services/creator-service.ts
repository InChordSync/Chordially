import type { CreatorProfileResponse } from "@chordially/shared"
import { ApiError, apiFetch } from "./api-client"

export type CreatorProfile = CreatorProfileResponse

export function getCreatorBySlug(slug: string): Promise<CreatorProfile> {
  return apiFetch<CreatorProfile>(
    `/api/creators/${encodeURIComponent(slug)}`
  )
}

export function isCreatorNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}
