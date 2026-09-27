import type { CreatorResponse } from "./creator.types.js"

/**
 * `"public"` profiles are fully visible to any visitor. `"limited"`
 * profiles hide bio/location while onboarding is incomplete or the
 * creator has opted out of full public discovery.
 */
export type CreatorVisibility = "public" | "limited"

export function applyVisibility(
  profile: CreatorResponse,
  mode: CreatorVisibility
): CreatorResponse {
  if (mode === "public") return profile

  return {
    ...profile,
    bio: null,
    location: null,
  }
}
