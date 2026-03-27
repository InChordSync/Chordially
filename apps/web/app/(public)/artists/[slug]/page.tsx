import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArtistPublicProfile, LiveState } from '../../../../types';
import { ArtistProfileHeader } from '@/components/artist/ArtistProfileHeader';
import { ArtistBio } from '@/components/artist/ArtistBio';
import { ArtistLiveState } from '@/components/artist/ArtistLiveState';

async function getArtistBySlug(slug: string): Promise<ArtistPublicProfile | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/api/artists/${slug}`, {
      cache: 'no-store', // Don't cache artist data as live state changes frequently
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching artist:', error);
    return null;
  }
}

async function getArtistLiveState(slug: string): Promise<LiveState | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/api/artists/${slug}/live-state`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching live state:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const artist = await getArtistBySlug(params.slug);

  if (!artist) {
    return {
      title: 'Artist Not Found | Chordially',
      description: 'This artist page doesn\'t exist or has been disabled.',
    };
  }

  const description = artist.bio 
    ? artist.bio.substring(0, 155).replace(/\n/g, ' ').trim() + (artist.bio.length > 155 ? '...' : '')
    : `Discover ${artist.name} on Chordially - your platform for live music and direct artist support.`;

  return {
    title: `${artist.name} on Chordially`,
    description,
    openGraph: {
      title: `${artist.name} on Chordially`,
      description,
      images: artist.avatarUrl ? [artist.avatarUrl] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${artist.name} on Chordially`,
      description,
      images: artist.avatarUrl ? [artist.avatarUrl] : [],
    },
    alternates: {
      canonical: `/artists/${artist.slug}`,
    },
  };
}

export default async function ArtistProfilePage({ params }: { params: { slug: string } }) {
  const artist = await getArtistBySlug(params.slug);

  if (!artist) {
    notFound();
  }

  const liveState = await getArtistLiveState(params.slug);

  return (
    <div className="min-h-screen bg-white">
      <ArtistProfileHeader artist={artist} />
      <ArtistLiveState 
        initialLiveState={liveState || { isLive: false }} 
        artistSlug={artist.slug}
      />
      <ArtistBio bio={artist.bio} />
    </div>
  );
}
