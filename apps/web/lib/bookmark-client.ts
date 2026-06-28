import type { PaginatedBookmarksResponse } from "@chordially/shared"
import { apiFetch, authHeaders } from "./api-client"

export function getBookmarks(
  token: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedBookmarksResponse> {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("pageSize", String(pageSize))
  return apiFetch<PaginatedBookmarksResponse>(
    `/api/bookmarks?${params.toString()}`,
    { headers: authHeaders(token) }
  )
}

export function bookmarkCreator(
  slug: string,
  token: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(
    `/api/bookmarks/${encodeURIComponent(slug)}`,
    {
      method: "POST",
      headers: authHeaders(token),
    }
  )
}

export function removeBookmark(
  slug: string,
  token: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(
    `/api/bookmarks/${encodeURIComponent(slug)}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    }
  )
}
