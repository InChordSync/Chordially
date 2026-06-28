import type { MediaAssetResponse } from "@chordially/shared"
import { apiFetch, authHeaders } from "./api-client"

export function getMediaAssets(
  token: string
): Promise<MediaAssetResponse[]> {
  return apiFetch<MediaAssetResponse[]>("/api/creators/me/media", {
    headers: authHeaders(token),
  })
}

export function getUploadUrl(
  token: string
): Promise<{ url: string; key: string }> {
  return apiFetch<{ url: string; key: string }>(
    "/api/creators/me/media/upload",
    {
      method: "POST",
      headers: authHeaders(token),
    }
  )
}

export async function uploadToPresignedUrl(
  url: string,
  file: File
): Promise<void> {
  const response = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  })

  if (!response.ok) {
    throw new Error("Upload failed")
  }
}

export function confirmUpload(
  token: string,
  key: string,
  altText?: string
): Promise<MediaAssetResponse> {
  return apiFetch<MediaAssetResponse>("/api/creators/me/media/confirm", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ key, altText: altText ?? null }),
  })
}

export function deleteMedia(
  token: string,
  mediaId: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(
    `/api/creators/me/media/${encodeURIComponent(mediaId)}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    }
  )
}

export function setMediaAsCover(
  token: string,
  mediaId: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(
    `/api/creators/me/media/${encodeURIComponent(mediaId)}/cover`,
    {
      method: "PATCH",
      headers: authHeaders(token),
    }
  )
}

export function reorderMedia(
  token: string,
  mediaId: string,
  sortOrder: number
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(
    `/api/creators/me/media/${encodeURIComponent(mediaId)}/reorder`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ sortOrder }),
    }
  )
}
