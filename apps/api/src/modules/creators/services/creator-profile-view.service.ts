import type { CreatorResponse } from "../types/creator.types.js"

/** Fields visible to any visitor viewing a creator's public profile. */
export type PublicCreatorView = Pick<
  CreatorResponse,
  | "id"
  | "displayName"
  | "slug"
  | "bio"
  | "avatarUrl"
  | "genre"
  | "location"
  | "isVerified"
>

/** Fields visible only to the creator viewing their own profile. */
export type PrivateCreatorView = CreatorResponse

export function toPublicView(profile: CreatorResponse): PublicCreatorView {
  const { id, displayName, slug, bio, avatarUrl, genre, location, isVerified } =
    profile
  return { id, displayName, slug, bio, avatarUrl, genre, location, isVerified }
}

export function toPrivateView(profile: CreatorResponse): PrivateCreatorView {
  return profile
}

export function toCreatorView(
  profile: CreatorResponse,
  isOwner: boolean
): PublicCreatorView | PrivateCreatorView {
  return isOwner ? toPrivateView(profile) : toPublicView(profile)
}
