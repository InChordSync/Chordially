import type { DiscoveryFilters } from "../types/discovery.js"

export function buildDiscoveryQueryString(filters: DiscoveryFilters): string {
  const params = new URLSearchParams()
  params.set("page", String(filters.page))
  params.set("limit", String(filters.limit))
  if (filters.genre) params.set("genre", filters.genre)
  if (filters.location) params.set("location", filters.location)
  if (filters.sort) params.set("sort", filters.sort)
  return params.toString()
}
