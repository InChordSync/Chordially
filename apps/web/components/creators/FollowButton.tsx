"use client"

import { useCallback, useState } from "react"
import { followCreator, unfollowCreator } from "../../lib/creator-client"

interface FollowButtonProps {
  creatorSlug: string
  initialIsFollowing: boolean
  token: string
  onFollowCountChange?: (delta: number) => void
}

export function FollowButton({
  creatorSlug,
  initialIsFollowing,
  token,
  onFollowCountChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [error, setError] = useState<string | null>(null)

  const handleToggle = useCallback(async () => {
    const previous = isFollowing
    setIsFollowing((prev) => !prev)
    setError(null)
    onFollowCountChange?.(previous ? -1 : 1)

    try {
      if (previous) {
        await unfollowCreator(creatorSlug, token)
      } else {
        await followCreator(creatorSlug, token)
      }
    } catch {
      setIsFollowing(previous)
      onFollowCountChange?.(previous ? 1 : -1)
      setError("Action failed. Please try again.")
    }
  }, [isFollowing, creatorSlug, token, onFollowCountChange])

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        style={isFollowing ? followingButtonStyle : followButtonStyle}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
      {error && (
        <p style={errorStyle} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

const followButtonStyle: React.CSSProperties = {
  padding: "8px 20px",
  borderRadius: 6,
  border: "1px solid #1d9bf0",
  background: "#fff",
  color: "#1d9bf0",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
}

const followingButtonStyle: React.CSSProperties = {
  padding: "8px 20px",
  borderRadius: 6,
  border: "1px solid #1d9bf0",
  background: "#1d9bf0",
  color: "#fff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
}

const errorStyle: React.CSSProperties = {
  color: "#c0392b",
  fontSize: 13,
  margin: "4px 0 0",
}
