'use client';

import { useState } from 'react';
import { ArtistPublicProfile } from '../../../types';
import { getInitials } from '@/lib/utils';
import { Share2, Twitter, Instagram, Music, ExternalLink } from 'lucide-react';

interface ArtistProfileHeaderProps {
  artist: ArtistPublicProfile;
}

export function ArtistProfileHeader({ artist }: ArtistProfileHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return <Twitter className="w-5 h-5" />;
      case 'instagram':
        return <Instagram className="w-5 h-5" />;
      case 'spotify':
      case 'soundcloud':
        return <Music className="w-5 h-5" />;
      default:
        return <ExternalLink className="w-5 h-5" />;
    }
  };

  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600">
        {artist.bannerUrl && (
          <img
            src={artist.bannerUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16">
          {/* Avatar */}
          <div className="flex items-end space-x-6">
            <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white overflow-hidden flex-shrink-0">
              {artist.avatarUrl ? (
                <img
                  src={artist.avatarUrl}
                  alt={`${artist.name} profile photo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl font-bold">
                  {getInitials(artist.name)}
                </div>
              )}
            </div>

            {/* Name and actions */}
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">{artist.name}</h1>
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  aria-label="Copy profile link"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copied ? 'Copied!' : 'Share profile'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Social links */}
          <div className="flex items-center space-x-4 mt-6">
            {artist.socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                aria-label={link.platform}
              >
                {getSocialIcon(link.platform)}
              </a>
            ))}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2 mt-4">
            {artist.genres.map((genre, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
