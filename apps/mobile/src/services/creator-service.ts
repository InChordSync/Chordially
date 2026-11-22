import type { CreatorProfileResponse } from "@chordially/shared"
import { apiFetch } from "./api-client"

export type CreatorProfile = CreatorProfileResponse

export function getCreatorBySlug(slug: string): Promise<CreatorProfile> {
  return apiFetch<CreatorProfile>(
    `/api/creators/${encodeURIComponent(slug)}`
  )
}
