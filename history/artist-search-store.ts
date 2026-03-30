/**
 * Issue #92 – Implement search and filtering for artist discovery
 *
 * File destination: apps/api/src/modules/artists/artist-search.store.ts
 *
 * What this does:
 *  - In-memory artist profile store with demo data
 *  - Supports free-text search on stageName + handle
 *  - Supports genre and city filters
 *  - Excludes DEACTIVATED artists from public results
 *  - Returns paginated results with total count
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArtistSearchResult {
  id: string;
  stageName: string;
  handle: string;
  slug: string;
  city: string;
  country: string;
  genres: string[];
  tagline?: string;
  avatarUrl?: string;
  tippingEnabled: boolean;
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
}

export interface ArtistSearchQuery {
  q?: string;
  genre?: string;
  city?: string;
  limit?: number;
  offset?: number;
}

export interface ArtistSearchResponse {
  items: ArtistSearchResult[];
  total: number;
  limit: number;
  offset: number;
  availableGenres: string[];
  availableCities: string[];
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const artists: ArtistSearchResult[] = [
  {
    id: "ap-1",
    stageName: "Nova Chords",
    handle: "nova-chords",
    slug: "nova-chords",
    city: "Lagos",
    country: "Nigeria",
    genres: ["Afrobeats", "Indie Soul"],
    tagline: "Bridging beats and borders",
    tippingEnabled: true,
    status: "ACTIVE",
  },
  {
    id: "ap-2",
    stageName: "Street Tempo",
    handle: "street-tempo",
    slug: "street-tempo",
    city: "Accra",
    country: "Ghana",
    genres: ["Jazz", "Highlife"],
    tagline: "Ghana's jazz heartbeat",
    tippingEnabled: true,
    status: "ACTIVE",
  },
  {
    id: "ap-3",
    stageName: "Midnight Strings",
    handle: "midnight-strings",
    slug: "midnight-strings",
    city: "Nairobi",
    country: "Kenya",
    genres: ["Folk", "Indie"],
    tagline: "Acoustic stories from East Africa",
    tippingEnabled: false,
    status: "DEACTIVATED",
  },
  {
    id: "ap-4",
    stageName: "Rhythm Ola",
    handle: "rhythm-ola",
    slug: "rhythm-ola",
    city: "Lagos",
    country: "Nigeria",
    genres: ["Afrobeats", "R&B"],
    tagline: "Soul music from the South",
    tippingEnabled: true,
    status: "ACTIVE",
  },
  {
    id: "ap-5",
    stageName: "Harmonic Drift",
    handle: "harmonic-drift",
    slug: "harmonic-drift",
    city: "Nairobi",
    country: "Kenya",
    genres: ["Electronic", "Afro-fusion"],
    tagline: "Electronic beats meet African rhythms",
    tippingEnabled: true,
    status: "ACTIVE",
  },
  {
    id: "ap-6",
    stageName: "Echo Tribe",
    handle: "echo-tribe",
    slug: "echo-tribe",
    city: "Accra",
    country: "Ghana",
    genres: ["Highlife", "Gospel"],
    tagline: "Faith and rhythm combined",
    tippingEnabled: true,
    status: "ACTIVE",
  },
];

// ─── Query helpers ────────────────────────────────────────────────────────────

/** All unique genres from active artists, sorted alphabetically */
function getAvailableGenres(): string[] {
  const genreSet = new Set<string>();
  for (const artist of artists) {
    if (artist.status !== "DEACTIVATED") {
      for (const genre of artist.genres) genreSet.add(genre);
    }
  }
  return [...genreSet].sort();
}

/** All unique cities from active artists, sorted alphabetically */
function getAvailableCities(): string[] {
  const citySet = new Set<string>();
  for (const artist of artists) {
    if (artist.status !== "DEACTIVATED") citySet.add(artist.city);
  }
  return [...citySet].sort();
}

/**
 * Search and filter artist profiles.
 * Deactivated artists are always excluded from public results.
 */
export function searchArtists(query: ArtistSearchQuery = {}): ArtistSearchResponse {
  const limit = query.limit ?? 20;
  const offset = query.offset ?? 0;
  const q = query.q?.trim().toLowerCase();
  const genre = query.genre?.trim().toLowerCase();
  const city = query.city?.trim().toLowerCase();

  const filtered = artists.filter((artist) => {
    // Always exclude deactivated
    if (artist.status === "DEACTIVATED") return false;

    // Free-text: match stageName or handle
    if (q) {
      const matchesName = artist.stageName.toLowerCase().includes(q);
      const matchesHandle = artist.handle.toLowerCase().includes(q);
      if (!matchesName && !matchesHandle) return false;
    }

    // Genre filter (case-insensitive exact match against any of the artist's genres)
    if (genre) {
      const matches = artist.genres.some((g) => g.toLowerCase() === genre);
      if (!matches) return false;
    }

    // City filter
    if (city && artist.city.toLowerCase() !== city) return false;

    return true;
  });

  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    limit,
    offset,
    availableGenres: getAvailableGenres(),
    availableCities: getAvailableCities(),
  };
}
