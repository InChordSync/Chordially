"use client"

import type { CreatorProfileResponse } from "@chordially/shared"
import { useCallback, useState } from "react"
import { FollowButton } from "./FollowButton"

interface CreatorHeaderProps {
  profile: CreatorProfileResponse
  followerCount?: number
  followingCount?: number
  token?: string | null
}

export function CreatorHeader({
  profile,
  followerCount: initialFollowerCount,
  followingCount,
  token,
}: CreatorHeaderProps) {
  const [followerCount, setFollowerCount] = useState(initialFollowerCount ?? 0)

  const handleFollowCountChange = useCallback((delta: number) => {
    setFollowerCount((prev) => Math.max(0, prev + delta))
  }, [])

  return (
    <div>
      {/* Banner */}
      {profile.bannerUrl ? (
        <img
          src={profile.bannerUrl}
          alt={`${profile.displayName}'s banner`}
          style={{
            width: "100%",
            height: 200,
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: 200,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        />
      )}

      {/* Avatar — overlaps bottom of banner */}
      <div style={{ padding: "0 1.5rem", position: "relative" }}>
        <div
          style={{
            position: "relative",
            marginTop: "-48px",
            marginBottom: "0.75rem",
          }}
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={`${profile.displayName}'s avatar`}
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                objectFit: "cover",
                border: "4px solid #fff",
              }}
            />
          ) : (
            <div
              aria-label="Default avatar"
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: "#ddd",
                border: "4px solid #fff",
              }}
            />
          )}
        </div>

        {/* Name + verified badge + follow button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>
              {profile.displayName}
            </h1>
            {profile.isVerified && (
              <span
                aria-label="Verified"
                style={{
                  color: "#1da1f2",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                ✓ Verified
              </span>
            )}
          </div>
          {token && (
            <FollowButton
              creatorSlug={profile.slug}
              initialIsFollowing={false}
              token={token}
              onFollowCountChange={handleFollowCountChange}
            />
          )}
        </div>

        {/* Follower / following counts */}
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#555" }}>
            <strong>{followerCount}</strong> followers
          </span>
          {followingCount !== undefined && (
            <span style={{ fontSize: "0.9rem", color: "#555" }}>
              <strong>{followingCount}</strong> following
            </span>
          )}
        </div>

        {profile.bio && (
          <p style={{ margin: "0.5rem 0", color: "#333" }}>{profile.bio}</p>
        )}

        {profile.genre && (
          <p style={{ margin: "0.25rem 0", fontSize: "0.9rem", color: "#555" }}>
            Genre: {profile.genre}
          </p>
        )}

        {profile.location && (
          <p style={{ margin: "0.25rem 0", fontSize: "0.9rem", color: "#555" }}>
            Location: {profile.location}
          </p>
        )}
      </div>
    </div>
  )
}
