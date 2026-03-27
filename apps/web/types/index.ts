export interface ArtistPublicProfile {
  slug: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isLive: boolean;
  liveSessionTitle: string | null;
  liveStartedAt: string | null; // ISO timestamp
  socialLinks: { platform: string; url: string }[];
  genres: string[];
  joinedAt: string; // ISO timestamp
}

export interface Artist {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isLive: boolean;
  liveSessionTitle: string | null;
  liveStartedAt: string | null;
  socialLinks: { platform: string; url: string }[];
  genres: string[];
  joinedAt: string;
  isEnabled: boolean;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveState {
  isLive: boolean;
  sessionTitle?: string;
  liveStartedAt?: string;
}
