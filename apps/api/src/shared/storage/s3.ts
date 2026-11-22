import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { env } from "../config/env.js"

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
})

export async function createAvatarUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(s3, command, { expiresIn: 300 })
}

export interface AvatarObject {
  key: string
  contentType?: string
  contentLength?: number
  body: Buffer
}

/**
 * Fetches an already-uploaded avatar object so the server can verify what was
 * actually stored (size, content-type and magic bytes) rather than trusting
 * the content type the client declared when it requested the presigned URL.
 */
export async function getAvatarObject(key: string): Promise<AvatarObject> {
  const command = new GetObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key })
  const response = await s3.send(command)

  const chunks: Uint8Array[] = []
  if (response.Body) {
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
  }

  return {
    key,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
    body: Buffer.concat(chunks),
  }
}
