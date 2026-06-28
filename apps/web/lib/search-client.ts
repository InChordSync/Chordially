import type { SearchFilters, SearchResponse } from "@chordially/shared"
import { apiFetch } from "./api-client"

export function searchApi(
  filters: SearchFilters
): Promise<SearchResponse> {
  const params = new URLSearchParams()
  params.set("q", filters.q)
  params.set("page", String(filters.page))
  params.set("limit", String(filters.limit))
  if (filters.genre) params.set("genre", filters.genre)
  if (filters.location) params.set("location", filters.location)

  return apiFetch<SearchResponse>(`/api/search?${params.toString()}`)
}
