'use client';

import { useState, useEffect } from 'react';
import { LiveState } from '../../../types';
import { formatDuration } from '@/lib/utils';
import { Play, Circle } from 'lucide-react';

interface ArtistLiveStateProps {
  initialLiveState: LiveState;
  artistSlug: string;
}

export function ArtistLiveState({ initialLiveState, artistSlug }: ArtistLiveStateProps) {
  const [liveState, setLiveState] = useState<LiveState>(initialLiveState);
  const [duration, setDuration] = useState<string>('');

  // Update duration every minute when live
  useEffect(() => {
    if (!liveState.isLive || !liveState.liveStartedAt) return;

    const updateDuration = () => {
      setDuration(formatDuration(liveState.liveStartedAt!));
    };

    updateDuration(); // Initial update
    const interval = setInterval(updateDuration, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [liveState.isLive, liveState.liveStartedAt]);

  // Poll live state every 60 seconds
  useEffect(() => {
    const pollLiveState = async () => {
      try {
        const response = await fetch(`/api/artists/${artistSlug}/live-state`);
        if (response.ok) {
          const newLiveState = await response.json();
          setLiveState(newLiveState);
        }
      } catch (error) {
        console.error('Failed to poll live state:', error);
      }
    };

    // Only poll if tab is visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pollLiveState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    const interval = setInterval(pollLiveState, 60000);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [artistSlug]);

  if (liveState.isLive) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Circle className="w-3 h-3 text-red-500 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-red-600 font-semibold">LIVE NOW</span>
                {duration && (
                  <span className="text-red-500 text-sm">• Live for {duration}</span>
                )}
              </div>
              {liveState.sessionTitle && (
                <p className="text-red-700 text-sm mt-1">{liveState.sessionTitle}</p>
              )}
            </div>
          </div>
          
          <a
            href={`/artists/${artistSlug}/session`}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Join session</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="flex items-center space-x-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <Circle className="w-3 h-3 text-gray-400 fill-current" />
        <span className="text-gray-600 font-medium">Offline</span>
      </div>
    </div>
  );
}
