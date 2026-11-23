import { randomUUID } from "node:crypto"
import { AppError } from "../../../shared/errors/app-error.js"
import type { AvatarObject } from "../../../shared/storage/s3.js"
import { getAvatarObject } from "../../../shared/storage/s3.js"
import { verifyAvatarUpload } from "../../creators/services/avatar-moderation.service.js"

// Both the legacy `avatars/<userId>.png` keys and the new per-upload
// `avatars/<userId>/<uuid>.png` keys are accepted. Nothing outside /avatars/
// is ever returned, so this cannot be used to delete or sign arbitrary S3 keys.
const AVATAR_KEY_PATTERN = /^\/avatars\/[^/]+(?:\/[^/]+)*\.(?:png|jpe?g|webp)$/i

/** Builds a fresh object key for every upload so a replaced avatar can never be served from cache. */
export function createAvatarKey(userId: string, contentType: string): string {
  const extension = contentType.split("/")[1]
  if (!extension) {
    throw new AppError(400, "INVALID_CONTENT_TYPE", "Unsupported avatar content type")
  }
  return `avatars/${userId}/${randomUUID()}.${extension}`
}

/** Extracts a safe S3 object key from a public avatar URL, or null if it isn't one. */
export function avatarKeyFromUrl(avatarUrl: string): string | null {
  let pathname: string
  try {
    pathname = decodeURIComponent(new URL(avatarUrl).pathname)
  } catch {
    return null
  }

  const match = AVATAR_KEY_PATTERN.exec(pathname)
  return match ? match[0].slice(1) : null
}

/**
 * Confirms the uploaded object before its URL is stored on the profile: reads
 * the bytes from S3 and applies the shared avatar moderation checks.
 * Returns the confirmed object key so the caller can clean up the old avatar
 * once (and only once) the profile update succeeds.
 */
export async function verifyAvatarForUser(
  creatorId: string,
  avatarUrl: string
): Promise<string> {
  const key = avatarKeyFromUrl(avatarUrl)
  if (!key) {
    throw new AppError(400, "INVALID_AVATAR_URL", "avatarUrl must be an avatar object URL")
  }

  let object: AvatarObject
  try {
    object = await getAvatarObject(key)
  } catch {
    throw new AppError(400, "AVATAR_NOT_UPLOADED", "Avatar has not been uploaded yet")
  }

  const result = await verifyAvatarUpload({ creatorId }, object)
  if (!result.allowed) {
    throw new AppError(
      400,
      "AVATAR_REJECTED",
      result.reason ?? "Avatar upload failed verification"
    )
  }

  return key
}
