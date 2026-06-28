import type { CreatorCardResponse, DiscoveryFilters, DiscoveryResponse } from "@chordially/shared"
import { buildDiscoveryQueryString } from "@chordially/shared"
import { apiFetch, authHeaders } from "./api-client"

export async function discoverCreators(
  filters: DiscoveryFilters,
  token?: string | null
): Promise<DiscoveryResponse> {
  const query = buildDiscoveryQueryString(filters)

  const headers: Record<string, string> = {}
  if (token) {
    Object.assign(headers, authHeaders(token))
  }

  return apiFetch<DiscoveryResponse>(`/api/discover?${query}`, { headers })
}

export function getCreatorCard(
  slug: string,
  token?: string | null
): Promise<CreatorCardResponse> {
  const headers: Record<string, string> = {}
  if (token) {
    Object.assign(headers, authHeaders(token))
  }
  return apiFetch<CreatorCardResponse>(`/api/creators/card/${encodeURIComponent(slug)}`, { headers })
}
