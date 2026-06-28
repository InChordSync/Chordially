import type { FollowCountResponse } from "@chordially/shared"

interface Props {
  followerCount: number
  followingCount: number
  showLabels?: boolean
}

export function FollowCountSummary({ followerCount, followingCount, showLabels = true }: Props) {
  return (
    <span style={containerStyle}>
      <span style={countStyle}>{followerCount.toLocaleString()}</span>
      {showLabels && <span style={labelStyle}> followers</span>}
      <span style={separatorStyle}> · </span>
      <span style={countStyle}>{followingCount.toLocaleString()}</span>
      {showLabels && <span style={labelStyle}> following</span>}
    </span>
  )
}

const containerStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 2,
}

const countStyle: React.CSSProperties = {
  fontWeight: 600,
  color: "#333",
}

const labelStyle: React.CSSProperties = {
  color: "#888",
  fontSize: 14,
}

const separatorStyle: React.CSSProperties = {
  color: "#ccc",
  margin: "0 4px",
}
