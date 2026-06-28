import type { BookmarkEntry } from "@chordially/shared"
import Link from "next/link"

interface BookmarkCardProps {
  bookmark: BookmarkEntry
  onRemove: (slug: string) => void
}

export function BookmarkCard({ bookmark, onRemove }: BookmarkCardProps) {
  const { creator } = bookmark

  return (
    <div style={cardStyle}>
      <Link href={`/creators/${creator.slug}`} style={linkStyle}>
        <div style={headerStyle}>
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={`${creator.displayName}'s avatar`}
              style={avatarStyle}
            />
          ) : (
            <div style={{ ...avatarStyle, ...avatarPlaceholderStyle }} />
          )}
          <div>
            <div style={nameRowStyle}>
              <span style={nameStyle}>{creator.displayName}</span>
              {creator.isVerified && (
                <span style={verifiedBadgeStyle} aria-label="Verified">
                  ✓
                </span>
              )}
            </div>
            {creator.genre && <span style={detailStyle}>{creator.genre}</span>}
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => onRemove(creator.slug)}
        style={removeButtonStyle}
      >
        Remove Bookmark
      </button>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  padding: 16,
  background: "#fff",
  display: "flex",
  flexDirection: "column",
  gap: 12,
}

const linkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
}

const avatarStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  objectFit: "cover",
}

const avatarPlaceholderStyle: React.CSSProperties = {
  background: "#ddd",
}

const nameRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
  alignItems: "center",
}

const nameStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 16,
}

const verifiedBadgeStyle: React.CSSProperties = {
  color: "#1d9bf0",
  fontSize: 14,
}

const detailStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#555",
}

const removeButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #e74c3c",
  background: "#fff",
  color: "#e74c3c",
  cursor: "pointer",
  fontSize: 13,
  alignSelf: "flex-start",
}
