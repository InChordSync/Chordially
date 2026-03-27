export interface DiscoverySession {
  id: string;
  artistName: string;
  slug: string;
  title: string;
  city: string;
  genres: string[];
  isLive: boolean;
  startsAt: string;
}

const sessions: DiscoverySession[] = [
  {
    id: "sess-1",
    artistName: "Nova Chords",
    slug: "nova-chords",
    title: "Rooftop Rehearsal",
    city: "Lagos",
    genres: ["Afrobeats", "Indie Soul"],
    isLive: true,
    startsAt: "2026-03-27T18:00:00.000Z"
  },
  {
    id: "sess-2",
    artistName: "Street Tempo",
    slug: "street-tempo",
    title: "Percussion & Brass Jam",
    city: "Accra",
    genres: ["Jazz", "Highlife"],
    isLive: true,
    startsAt: "2026-03-27T18:30:00.000Z"
  },
  {
    id: "sess-3",
    artistName: "Midnight Strings",
    slug: "midnight-strings",
    title: "Acoustic Stories",
    city: "Nairobi",
    genres: ["Folk", "Indie"],
    isLive: false,
    startsAt: "2026-03-28T19:00:00.000Z"
  }
];

export interface DiscoveryQuery {
  status?: "live" | "upcoming";
  limit?: number;
  offset?: number;
}

export interface DiscoveryResponse {
  items: DiscoverySession[];
  total: number;
  limit: number;
  offset: number;
}

export function listDiscoverySessions(query: DiscoveryQuery = {}): DiscoveryResponse {
  const status = query.status ?? "live";
  const offset = query.offset ?? 0;
  const limit = query.limit ?? 12;

  const filtered = sessions.filter((session) =>
    status === "live" ? session.isLive : !session.isLive
  );

  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    limit,
    offset
  };
}
