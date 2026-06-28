import type { DiscoveryCreator } from "@chordially/shared"
import Link from "next/link"

interface CreatorSpotlightCardProps {
  creator: DiscoveryCreator
}

export function CreatorSpotlightCard({
  creator,
}: CreatorSpotlightCardProps) {
  return (
    <Link href={`/creators/${creator.slug}`} style={linkStyle}>
      <div style={cardStyle}>
        <div style={bannerPlaceholderStyle} />
        <div style={contentStyle}>
          <div style={avatarRowStyle}>
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={`${creator.displayName}'s avatar`}
                style={avatarStyle}
              />
            ) : (
              <div style={{ ...avatarStyle, ...avatarPlaceholderStyle }} />
            )}
            {creator.isVerified && (
              <span style={verifiedBadgeStyle} aria-label="Verified">
                ✓
              </span>
            )}
          </div>
          <span style={nameStyle}>{creator.displayName}</span>
          {creator.genre && <span style={genreStyle}>{creator.genre}</span>}
          <span style={followerStyle}>
            {creator.followerCount} follower
            {creator.followerCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </Link>
  )
}

const linkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  flexShrink: 0,
}

const cardStyle: React.CSSProperties = {
  width: 220,
  border: "1px solid #e0e0e0",
  borderRadius: 12,
  overflow: "hidden",
  background: "#fff",
}

const bannerPlaceholderStyle: React.CSSProperties = {
  height: 80,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
}

const contentStyle: React.CSSProperties = {
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  alignItems: "center",
  textAlign: "center",
}

const avatarRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginTop: -32,
}

const avatarStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  objectFit: "cover",
  border: "3px solid #fff",
}

const avatarPlaceholderStyle: React.CSSProperties = {
  background: "#ddd",
}

const verifiedBadgeStyle: React.CSSProperties = {
  color: "#1d9bf0",
  fontSize: 16,
}

const nameStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 16,
}

const genreStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#666",
}

const followerStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#888",
}
