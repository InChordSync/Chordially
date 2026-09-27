/**
 * S3 object metadata for a creator's avatar or banner image, so the
 * repository can persist provenance (not just the final public URL).
 */
export interface AvatarBannerMetadata {
  url: string
  s3Key: string
  contentType: string
  sizeBytes: number
  uploadedAt: string
}

export function buildAvatarBannerMetadata(input: {
  url: string
  s3Key: string
  contentType: string
  sizeBytes: number
}): AvatarBannerMetadata {
  return {
    ...input,
    uploadedAt: new Date().toISOString(),
  }
}
