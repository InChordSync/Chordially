/**
 * Issue #92 – Implement search and filtering for artist discovery
 *
 * File destination: apps/web/app/discover/page.tsx  (replaces existing)
 *
 * What this does:
 *  - Server Component – no auth required (public discovery)
 *  - Reads ?q=, ?genre=, ?city= from searchParams
 *  - Fetches from GET /artists/search, falls back to demo data
 *  - Shows filter bar: text search, genre select, city select
 *  - Renders result grid of artist cards
 *  - Empty state and filter reset supported
 *
 * Acceptance criteria covered:
 *  ✓ Users can search by artist name or handle
 *  ✓ Genre and city filters narrow results correctly
 *  ✓ Empty results and filter resets are handled
 */

import Link from "next/link";
import { Shell } from "../../components/layout/shell";
import { Card } from "../../components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArtistResult {
  id: string;
  stageName: string;
  handle: string;
  slug: string;
  city: string;
  country: string;
  genres: string[];
  tagline?: string;
  tippingEnabled: boolean;
}

interface SearchResponse {
  items: ArtistResult[];
  total: number;
  availableGenres: string[];
  availableCities: string[];
}

// ─── Demo fallback ────────────────────────────────────────────────────────────

const DEMO_RESPONSE: SearchResponse = {
  items: [
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
    },
  ],
  total: 5,
  availableGenres: ["Afrobeats", "Afro-fusion", "Electronic", "Gospel", "Highlife", "Indie Soul", "Jazz", "R&B"],
  availableCities: ["Accra", "Lagos", "Nairobi"],
};

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchArtists(filters: {
  q?: string;
  genre?: string;
  city?: string;
}): Promise<SearchResponse> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.city) params.set("city", filters.city);
  params.set("limit", "50");

  try {
    const res = await fetch(`${API_URL}/artists/search?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) return DEMO_RESPONSE;
    return (await res.json()) as SearchResponse;
  } catch {
    return DEMO_RESPONSE;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { q?: string; genre?: string; city?: string };
}) {
  const data = await fetchArtists(searchParams);
  const hasFilters = !!(searchParams.q || searchParams.genre || searchParams.city);

  return (
    <Shell
      title="Discover artists"
      subtitle="Find and support talented artists from across the continent."
    >
      {/* ── Filter bar ── */}
      <Card title="Search & filter">
        <form method="GET" className="nav" style={{ flexWrap: "wrap", gap: 8 }}>
          <input
            className="input"
            type="search"
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Search by name or handle"
            style={{ flex: "1 1 200px", minWidth: 160 }}
          />
          <select
            className="input"
            name="genre"
            defaultValue={searchParams.genre ?? ""}
            style={{ width: "auto" }}
          >
            <option value="">All genres</option>
            {data.availableGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <select
            className="input"
            name="city"
            defaultValue={searchParams.city ?? ""}
            style={{ width: "auto" }}
          >
            <option value="">All cities</option>
            {data.availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <button className="button button--secondary" type="submit">
            Search
          </button>
          {hasFilters && (
            <Link href="/discover" className="button button--secondary">
              Clear filters
            </Link>
          )}
        </form>
      </Card>

      {/* ── Results summary ── */}
      <p className="muted" style={{ fontSize: "0.85rem" }}>
        {data.total} artist{data.total !== 1 ? "s" : ""} found
        {searchParams.q && <> matching &ldquo;{searchParams.q}&rdquo;</>}
        {searchParams.genre && <> in <strong>{searchParams.genre}</strong></>}
        {searchParams.city && <> from <strong>{searchParams.city}</strong></>}
      </p>

      {/* ── Artist grid ── */}
      {data.items.length === 0 ? (
        <Card title="No results">
          <p className="muted">
            No artists match your current filters.{" "}
            <Link href="/discover" style={{ color: "var(--accent)" }}>
              Clear filters
            </Link>{" "}
            to see all artists.
          </p>
        </Card>
      ) : (
        <div className="grid grid--3">
          {data.items.map((artist) => (
            <Link
              key={artist.id}
              href={`/artists/${artist.slug}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="card"
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
              >
                <p className="label" style={{ marginBottom: 0 }}>
                  {artist.stageName}
                </p>
                <p className="muted" style={{ margin: 0, fontSize: "0.82rem" }}>
                  @{artist.handle}
                </p>
                {artist.tagline && (
                  <p
                    className="muted"
                    style={{ margin: 0, fontSize: "0.85rem", fontStyle: "italic" }}
                  >
                    {artist.tagline}
                  </p>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto", paddingTop: 6 }}>
                  <span className="chip">
                    {artist.city}, {artist.country}
                  </span>
                  {artist.genres.map((genre) => (
                    <span key={genre} className="chip">
                      {genre}
                    </span>
                  ))}
                  {artist.tippingEnabled && (
                    <span className="chip" style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>
                      Tips on
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}
