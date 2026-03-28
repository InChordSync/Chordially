import { cookies } from "next/headers";

export interface ArtistDraft {
  stageName: string;
  slug: string;
  city: string;
  genres: string;
  bio: string;
  wallet: string;
}

const cookieName = "chordially_artist";

const defaultArtist: ArtistDraft = {
  stageName: "Nova Chords",
  slug: "nova-chords",
  city: "Lagos",
  genres: "Afrobeats, Indie Soul",
  bio: "Loop pedal sets with real-time audience requests and instant Stellar tips.",
  wallet: "GCFX3GM2V4N2O5NFEZ5XGUV3VZL57BC4Q43SGV5WW6H2I6J53GVL5W7W"
};

export function getArtist() {
  const raw = cookies().get(cookieName)?.value;

  if (!raw) {
    return defaultArtist;
  }

  try {
    return JSON.parse(raw) as ArtistDraft;
  } catch {
    return defaultArtist;
  }
}

export function setArtist(artist: ArtistDraft) {
  cookies().set(cookieName, JSON.stringify(artist), {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
}

export function getArtistBySlug(slug: string) {
  const artist = getArtist();
  return artist.slug === slug ? artist : null;
}
