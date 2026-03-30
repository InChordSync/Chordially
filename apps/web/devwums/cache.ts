// Cache and revalidation helpers for Next.js public pages

export const CACHE_TAGS = {
  artists: "artists",
  sessions: "sessions",
  featuredArtists: "featured-artists",
  discoverPage: "discover-page"
} as const;

// TTL values in seconds
export const REVALIDATE = {
  static: false as const,       // never revalidate (truly static)
  slow: 3600,                   // 1 hour — artist profiles, bios
  medium: 300,                  // 5 min  — session listings, discover
  fast: 60,                     // 1 min  — live session counts, tip totals
  realtime: 0                   // no cache — admin pages, user-specific data
} as const;

export type RevalidateValue = (typeof REVALIDATE)[keyof typeof REVALIDATE];

/**
 * Returns Next.js fetch options for a given cache strategy.
 * Usage: fetch(url, fetchOptions(REVALIDATE.medium, [CACHE_TAGS.sessions]))
 */
export function fetchOptions(
  revalidate: RevalidateValue,
  tags?: string[]
): RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } {
  if (revalidate === false) {
    return { cache: "force-cache", next: { tags } };
  }
  if (revalidate === 0) {
    return { cache: "no-store" };
  }
  return { next: { revalidate, tags } };
}
