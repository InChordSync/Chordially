'use client';

import { useState } from 'react';

interface ArtistBioProps {
  bio: string | null;
}

export function ArtistBio({ bio }: ArtistBioProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!bio || bio.trim() === '') {
    return null;
  }

  const shouldTruncate = bio.length > 300;
  const displayBio = shouldTruncate && !isExpanded 
    ? bio.substring(0, 300) + '...' 
    : bio;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="prose prose-gray max-w-none">
        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
          {displayBio}
        </div>
        
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    </div>
  );
}
