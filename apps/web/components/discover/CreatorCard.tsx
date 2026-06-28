interface CreatorCardData {
  id: string
  slug: string
  displayName: string
  avatarUrl: string | null
  genre: string | null
  location: string | null
  tags: string[]
  isVerified: boolean
  followerCount: number
  isFollowing?: boolean
  isBookmarked?: boolean
}

export function CreatorCard({ creator }: { creator: CreatorCardData }) {
  return (
    <div style={cardStyle}>
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
          <span style={followerCountStyle}>
            {creator.followerCount} follower{creator.followerCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      {creator.genre && <p style={detailStyle}>Genre: {creator.genre}</p>}
      {creator.location && <p style={detailStyle}>Location: {creator.location}</p>}
      {creator.tags.length > 0 && (
        <div style={tagsRowStyle}>
          {creator.tags.slice(0, 3).map((tag) => (
            <span key={tag} style={tagStyle}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <div style={indicatorRowStyle}>
        {creator.isFollowing && (
          <span style={followingIndicatorStyle}>Following</span>
        )}
        {creator.isBookmarked && (
          <span style={bookmarkedIndicatorStyle}>Bookmarked</span>
        )}
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  padding: 16,
  background: "#fff",
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  marginBottom: 8,
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

const followerCountStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#666",
}

const detailStyle: React.CSSProperties = {
  margin: "4px 0",
  fontSize: 14,
  color: "#333",
}

const tagsRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  marginTop: 8,
}

const tagStyle: React.CSSProperties = {
  background: "#f0f0f0",
  borderRadius: 4,
  padding: "2px 8px",
  fontSize: 12,
  color: "#555",
}

const indicatorRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 8,
}

const followingIndicatorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#1d9bf0",
  fontWeight: 500,
}

const bookmarkedIndicatorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#e67e22",
  fontWeight: 500,
}
