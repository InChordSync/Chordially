"use client"

import { useState } from "react"
import type { MediaAssetResponse } from "@chordially/shared"

interface MediaItemProps {
  asset: MediaAssetResponse
  isFirst: boolean
  isLast: boolean
  onDelete: (id: string) => Promise<void>
  onSetCover: (id: string) => Promise<void>
  onMoveUp: (id: string) => Promise<void>
  onMoveDown: (id: string) => Promise<void>
}

export function MediaItem({
  asset,
  isFirst,
  isLast,
  onDelete,
  onSetCover,
  onMoveUp,
  onMoveDown,
}: MediaItemProps) {
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete(asset.id)
    } finally {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div
      style={{
        position: "relative",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <img
        src={asset.url}
        alt={asset.altText ?? "Media"}
        style={{
          width: "100%",
          height: 180,
          objectFit: "cover",
          display: "block",
        }}
      />

      {asset.isCover && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: "#1a7f37",
            color: "#fff",
            fontSize: "0.75rem",
            padding: "2px 8px",
            borderRadius: 4,
            fontWeight: 600,
          }}
        >
          Cover
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.25rem",
          padding: "0.5rem",
          background: "#fafafa",
        }}
      >
        {!asset.isCover && (
          <button
            type="button"
            onClick={() => onSetCover(asset.id)}
            style={{ fontSize: "0.8rem", padding: "2px 8px" }}
          >
            Set as Cover
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            isFirst ? onMoveDown(asset.id) : onMoveUp(asset.id)
          }
          disabled={isFirst && isLast}
          style={{ fontSize: "0.8rem", padding: "2px 8px" }}
        >
          {isFirst ? "↓" : "↑"}
        </button>

        {!showConfirm ? (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            style={{ fontSize: "0.8rem", padding: "2px 8px", color: "#b00020" }}
          >
            Delete
          </button>
        ) : (
          <span style={{ fontSize: "0.8rem", display: "flex", gap: "0.25rem", alignItems: "center" }}>
            Delete?
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              style={{ fontSize: "0.8rem", padding: "2px 6px" }}
            >
              {deleting ? "..." : "Yes"}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              style={{ fontSize: "0.8rem", padding: "2px 6px" }}
            >
              No
            </button>
          </span>
        )}
      </div>
    </div>
  )
}
