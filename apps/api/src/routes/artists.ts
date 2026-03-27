import express from 'express';
import { ArtistPublicProfile, LiveState } from '../types';

const router = express.Router();

// Mock data - replace with actual database queries
const mockArtists: Record<string, ArtistPublicProfile> = {
  'john-doe': {
    slug: 'john-doe',
    name: 'John Doe',
    bio: 'Passionate musician sharing my journey through strings and melodies. Every note tells a story.',
    avatarUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&h=150&fit=crop&crop=face',
    bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=400&fit=crop',
    isLive: true,
    liveSessionTitle: 'Acoustic Evening Session',
    liveStartedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(), // 42 minutes ago
    socialLinks: [
      { platform: 'twitter', url: 'https://twitter.com/johndoe' },
      { platform: 'instagram', url: 'https://instagram.com/johndoe' },
      { platform: 'spotify', url: 'https://spotify.com/artist/johndoe' }
    ],
    genres: ['Acoustic', 'Folk', 'Indie'],
    joinedAt: '2023-01-15T10:00:00Z'
  },
  'sarah-smith': {
    slug: 'sarah-smith',
    name: 'Sarah Smith',
    bio: 'Electronic music producer and DJ. Creating beats that move your soul.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=400&fit=crop',
    isLive: false,
    liveSessionTitle: null,
    liveStartedAt: null,
    socialLinks: [
      { platform: 'instagram', url: 'https://instagram.com/sarahsmith' },
      { platform: 'soundcloud', url: 'https://soundcloud.com/sarahsmith' }
    ],
    genres: ['Electronic', 'EDM', 'House'],
    joinedAt: '2023-03-20T14:30:00Z'
  }
};

// GET /api/artists/:slug - Public artist profile
router.get('/:slug', (req, res) => {
  const { slug } = req.params;
  
  try {
    const artist = mockArtists[slug];
    
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Return only public fields (whitelisted)
    const publicProfile: ArtistPublicProfile = {
      slug: artist.slug,
      name: artist.name,
      bio: artist.bio,
      avatarUrl: artist.avatarUrl,
      bannerUrl: artist.bannerUrl,
      isLive: artist.isLive,
      liveSessionTitle: artist.liveSessionTitle,
      liveStartedAt: artist.liveStartedAt,
      socialLinks: artist.socialLinks,
      genres: artist.genres,
      joinedAt: artist.joinedAt
    };

    res.json(publicProfile);
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/artists/:slug/live-state - Live state polling endpoint
router.get('/:slug/live-state', (req, res) => {
  const { slug } = req.params;
  
  try {
    const artist = mockArtists[slug];
    
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const liveState: LiveState = {
      isLive: artist.isLive,
      sessionTitle: artist.liveSessionTitle || undefined,
      liveStartedAt: artist.liveStartedAt || undefined
    };

    // Prevent caching of live state
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json(liveState);
  } catch (error) {
    console.error('Error fetching live state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
