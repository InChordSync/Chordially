"use client";

import React, { useState, useEffect, useRef } from "react";

export interface CreatorSpotlightItem {
  id: string;
  displayName: string;
  slug: string;
  avatarUrl?: string;
  tagline?: string;
  followerCount: number;
  isFollowing?: boolean;
  isBookmarked?: boolean;
}

export interface WebDiscoveryShellProps {
  initialSpotlight?: CreatorSpotlightItem[];
  isSignedIn?: boolean;
  onFollowToggle?: (creatorId: string, currentStatus: boolean) => Promise<boolean>;
  onBookmarkToggle?: (creatorId: string, currentStatus: boolean) => void;
}

export function WebDiscoveryShell({
  initialSpotlight = [],
  isSignedIn = false,
  onFollowToggle,
  onBookmarkToggle,
}: WebDiscoveryShellProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [creators, setCreators] = useState<CreatorSpotlightItem[]>(initialSpotlight);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [pendingFollowIds, setPendingFollowIds] = useState<Set<string>>(new Set());

  // Search Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredCreators = creators.filter((c) =>
    c.displayName.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredCreators.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCreators.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCreators.length) % filteredCreators.length);
    } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < filteredCreators.length) {
      e.preventDefault();
      const selected = filteredCreators[selectedIndex];
      handleOptimisticFollow(selected.id, !!selected.isFollowing);
    } else if (e.key === "Escape") {
      setSelectedIndex(-1);
    }
  };

  // Optimistic follow/unfollow
  const handleOptimisticFollow = async (creatorId: string, currentFollowing: boolean) => {
    const nextFollowing = !currentFollowing;

    // Optimistic UI state update
    setCreators((prev) =>
      prev.map((item) =>
        item.id === creatorId
          ? {
              ...item,
              isFollowing: nextFollowing,
              followerCount: nextFollowing ? item.followerCount + 1 : item.followerCount - 1,
            }
          : item
      )
    );

    setPendingFollowIds((prev) => new Set(prev).add(creatorId));

    try {
      if (onFollowToggle) {
        const success = await onFollowToggle(creatorId, currentFollowing);
        if (!success) throw new Error("Follow action failed");
      }
    } catch {
      // Revert state on error
      setCreators((prev) =>
        prev.map((item) =>
          item.id === creatorId
            ? {
                ...item,
                isFollowing: currentFollowing,
                followerCount: currentFollowing ? item.followerCount + 1 : item.followerCount - 1,
              }
            : item
        )
      );
    } finally {
      setPendingFollowIds((prev) => {
        const copy = new Set(prev);
        copy.delete(creatorId);
        return copy;
      });
    }
  };

  // Bookmark toggle
  const handleBookmarkToggle = (creatorId: string) => {
    const isBookmarked = bookmarks.includes(creatorId);
    const updated = isBookmarked
      ? bookmarks.filter((id) => id !== creatorId)
      : [...bookmarks, creatorId];

    setBookmarks(updated);
    setCreators((prev) =>
      prev.map((item) => (item.id === creatorId ? { ...item, isBookmarked: !isBookmarked } : item))
    );
    if (onBookmarkToggle) {
      onBookmarkToggle(creatorId, isBookmarked);
    }
  };

  const bookmarkedCreators = creators.filter((c) => bookmarks.includes(c.id) || c.isBookmarked);

  return (
    <div className="web-discovery-shell space-y-6">
      {/* Hero Zone: Search & Keyboard Navigation */}
      <div className="hero-search-zone p-4 bg-slate-900 text-white rounded-lg">
        <h2 className="text-xl font-bold mb-2">Discover Creators</h2>
        <input
          type="text"
          role="searchbox"
          aria-label="Search creators"
          placeholder="Search by name or slug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-2 rounded bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {debouncedQuery && (
          <p className="text-sm text-slate-400 mt-2" data-testid="search-debounce-indicator">
            Showing results for "{debouncedQuery}"
          </p>
        )}
      </div>

      {/* Hero Zone: Creator Spotlight Row */}
      <div className="creator-spotlight-zone" data-testid="creator-spotlight-row">
        <h3 className="text-lg font-semibold mb-3">Featured Creators</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredCreators.map((creator, idx) => (
            <div
              key={creator.id}
              data-testid={`creator-card-${creator.id}`}
              className={`p-4 rounded-lg border transition-all ${
                idx === selectedIndex ? "border-indigo-500 bg-indigo-50/10" : "border-slate-700 bg-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">{creator.displayName}</h4>
                <button
                  type="button"
                  data-testid={`bookmark-btn-${creator.id}`}
                  onClick={() => handleBookmarkToggle(creator.id)}
                  className="text-yellow-400 hover:text-yellow-300"
                >
                  {bookmarks.includes(creator.id) || creator.isBookmarked ? "★" : "☆"}
                </button>
              </div>
              <p className="text-sm text-slate-400">@{creator.slug}</p>
              <p className="text-xs text-slate-500 mt-1">{creator.followerCount} followers</p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  data-testid={`follow-btn-${creator.id}`}
                  disabled={pendingFollowIds.has(creator.id)}
                  onClick={() => handleOptimisticFollow(creator.id, !!creator.isFollowing)}
                  className={`px-3 py-1 text-sm rounded font-medium ${
                    creator.isFollowing
                      ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                      : "bg-indigo-600 text-white hover:bg-indigo-500"
                  }`}
                >
                  {creator.isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signed-in Bookmarked Creators Panel */}
      {isSignedIn && (
        <div className="bookmarked-creators-panel p-4 bg-slate-800 rounded-lg border border-slate-700" data-testid="bookmarked-creators-panel">
          <h3 className="text-lg font-semibold text-white mb-2">Bookmarked Creators</h3>
          {bookmarkedCreators.length === 0 ? (
            <p className="text-sm text-slate-400" data-testid="empty-bookmarks-msg">
              No bookmarked creators yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {bookmarkedCreators.map((item) => (
                <span
                  key={item.id}
                  data-testid={`bookmark-chip-${item.id}`}
                  className="px-3 py-1 bg-slate-700 text-slate-200 text-sm rounded-full flex items-center gap-2"
                >
                  @{item.slug}
                  <button
                    type="button"
                    onClick={() => handleBookmarkToggle(item.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
