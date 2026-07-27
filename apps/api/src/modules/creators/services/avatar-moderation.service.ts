/** Input passed to the avatar moderation hook ahead of an upload. */
export interface AvatarModerationInput {
  creatorId: string
  mimeType: string
  sizeBytes: number
}

export interface ModerationResult {
  allowed: boolean
  reason?: string
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024

/**
 * Structural checks that run before an avatar is accepted. This is a
 * placeholder hook: it does not yet call out to any image-safety model,
 * but gives future moderation tooling a single, well-typed entry point.
 */
export function moderateAvatarUpload(
  input: AvatarModerationInput
): ModerationResult {
  if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
    return { allowed: false, reason: "Unsupported image type" }
  }

  if (input.sizeBytes > MAX_SIZE_BYTES) {
    return { allowed: false, reason: "Image exceeds maximum size" }
  }

  return { allowed: true }
}
