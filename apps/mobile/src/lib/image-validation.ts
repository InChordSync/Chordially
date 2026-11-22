export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

export function validatePickedImage(asset: {
  mimeType?: string | null
  fileSize?: number | null
}): string | null {
  const mimeType = asset.mimeType ?? "image/jpeg"

  if (!ALLOWED_IMAGE_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Please choose a JPEG, PNG, WebP, HEIC, or HEIF image"
  }

  if (typeof asset.fileSize === "number" && asset.fileSize > MAX_IMAGE_SIZE_BYTES) {
    return "Image must be smaller than 5 MB"
  }

  return null
}
