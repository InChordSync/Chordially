"use client"

import type { MediaAssetResponse } from "@chordially/shared"
import { MediaItem } from "./MediaItem"

interface MediaGalleryProps {
  assets: MediaAssetResponse[]
  onDelete: (id: string) => Promise<void>
  onSetCover: (id: string) => Promise<void>
  onMoveUp: (id: string) => Promise<void>
  onMoveDown: (id: string) => Promise<void>
}

export function MediaGallery({
  assets,
  onDelete,
  onSetCover,
  onMoveUp,
  onMoveDown,
}: MediaGalleryProps) {
  if (assets.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "3rem 1rem",
          color: "#888",
          border: "2px dashed #ddd",
          borderRadius: 8,
        }}
      >
        No media yet. Click "Add Media" to upload your first image.
      </div>
    )
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "1rem",
      }}
    >
      {assets
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((asset, index) => (
          <MediaItem
            key={asset.id}
            asset={asset}
            isFirst={index === 0}
            isLast={index === assets.length - 1}
            onDelete={onDelete}
            onSetCover={onSetCover}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />
        ))}
    </div>
  )
}
