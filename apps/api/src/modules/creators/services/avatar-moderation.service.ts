import { getAvatarObject, type AvatarObject } from "../../../shared/storage/s3.js"
import { AppError } from "../../../shared/errors/app-error.js"

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

// Magic-byte signatures used to verify the bytes actually uploaded match the
// declared image type (defeats a client that uploads arbitrary content under
// an allowed content type).
const MAGIC_BYTES: Record<string, (buf: Buffer) => boolean> = {
  "image/jpeg": (buf) =>
    buf.length > 3 &&
    buf[0] === 0xff &&
    buf[1] === 0xd8 &&
    buf[2] === 0xff,
  "image/png": (buf) =>
    buf.length > 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a,
  "image/webp": (buf) =>
    buf.length > 12 &&
    buf.toString("latin1", 0, 4) === "RIFF" &&
    buf.toString("latin1", 8, 12) === "WEBP",
}

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

/** Derives the S3 object key from the public avatar URL issued at upload time. */
export function avatarUrlToKey(avatarUrl: string): string | null {
  const match = /\/avatars\/[^/]+$/.exec(avatarUrl)
  if (!match) {
    return null
  }
  return match[0].replace(/^\//, "")
}

/**
 * Post-upload verification: the client's declared content type is only used to
 * produce the presigned URL; here we fetch the stored object and verify its
 * real size, content-type and magic bytes, then run moderation, before the
 * avatar is marked active. Throws a 400 AppError when the object doesn't
 * match an allowed image type/size.
 */
export async function verifyAvatarUpload(
  defaultModerationInput: Omit<AvatarModerationInput, "mimeType" | "sizeBytes">,
  object: AvatarObject
): Promise<{ allowed: boolean; reason?: string }> {
  const sizeBytes = object.contentLength ?? object.body.length
  const declaredType = object.contentType

  const moderation = moderateAvatarUpload({
    ...defaultModerationInput,
    mimeType: declaredType ?? "",
    sizeBytes,
  })
  if (!moderation.allowed) {
    return { allowed: false, reason: moderation.reason }
  }

  const magicCheck = MAGIC_BYTES[declaredType]
  if (!magicCheck || !magicCheck(object.body)) {
    return { allowed: false, reason: "Uploaded object does not match its declared image type" }
  }

  return { allowed: true }
}

/**
 * Orchestrates the full avatar verification + moderation flow from a public
 * URL: reads the object from S3, verifies it, and throws a client error when
 * the stored bytes don't pass. Returns the object key on success there.
 */
export async function verifyAvatarUrl(
  creatorId: string,
  avatarUrl: string
): Promise<string> {
  const key = avatarUrlToKey(avatarUrl)
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
