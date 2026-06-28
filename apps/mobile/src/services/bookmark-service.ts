import type { PaginatedBookmarksResponse } from "@chordially/shared"
import { apiFetch } from "./api-client"

export async function getBookmarks(
  token: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedBookmarksResponse> {
  return apiFetch<PaginatedBookmarksResponse>(
    `/api/users/me/bookmarks?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
}

export async function bookmarkCreator(
  slug: string,
  token: string
): Promise<{ bookmarked: boolean }> {
  return apiFetch<{ bookmarked: boolean }>(
    `/api/creators/${encodeURIComponent(slug)}/bookmark`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
}

export async function removeBookmark(
  slug: string,
  token: string
): Promise<{ bookmarked: boolean }> {
  return apiFetch<{ bookmarked: boolean }>(
    `/api/creators/${encodeURIComponent(slug)}/bookmark`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
}
