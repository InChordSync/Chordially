import crypto from "node:crypto";
import path from "node:path";

export type ImageContext = "profile" | "session" | "banner";

export interface UploadedImage {
  id: string;
  context: ImageContext;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedAt: Date;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const imageStore = new Map<string, UploadedImage>();

function validateImage(mimeType: string, sizeBytes: number): void {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}. Allowed: jpeg, png, webp`);
  }
  if (sizeBytes > MAX_SIZE_BYTES) {
    throw new Error(`Image exceeds 5 MB limit (got ${(sizeBytes / 1024 / 1024).toFixed(2)} MB)`);
  }
}

export function registerImageUpload(input: {
  context: ImageContext;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}): UploadedImage {
  validateImage(input.mimeType, input.sizeBytes);

  const id = crypto.randomUUID();
  const ext = path.extname(input.originalName) || ".jpg";
  const filename = `${input.context}-${id}${ext}`;
  const url = `/uploads/${input.context}/${filename}`;

  const record: UploadedImage = {
    id,
    context: input.context,
    filename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    url,
    uploadedAt: new Date()
  };

  imageStore.set(id, record);
  return record;
}

export function getUploadedImage(id: string): UploadedImage | undefined {
  return imageStore.get(id);
}
