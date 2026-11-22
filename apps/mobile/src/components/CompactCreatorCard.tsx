import React, { useEffect, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native"

export interface CompactCreatorCardProps {
  id: string
  displayName: string
  slug: string
  avatarUrl?: string | null
  followerCount: number
  isFollowing?: boolean
  onFollowToggle?: (
    creatorId: string,
    currentFollowing: boolean
  ) => Promise<boolean | number | { followerCount?: number; following?: boolean }>
}

export function CompactCreatorCard({
  id,
  displayName,
  slug,
  avatarUrl,
  followerCount: initialFollowerCount,
  isFollowing: initialIsFollowing = false,
  onFollowToggle,
}: CompactCreatorCardProps) {
  const [following, setFollowing] = useState(initialIsFollowing)
  const [followerCount, setFollowerCount] = useState(Math.max(0, initialFollowerCount))
  const [isLoading, setIsLoading] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  useEffect(() => {
    setFollowing(initialIsFollowing)
  }, [initialIsFollowing])

  useEffect(() => {
    setFollowerCount(Math.max(0, initialFollowerCount))
  }, [initialFollowerCount])

  useEffect(() => {
    setAvatarError(false)
  }, [avatarUrl])

  const handlePressFollow = async () => {
    if (isLoading) return

    const prevFollowing = following
    const prevCount = followerCount

    const nextFollowing = !prevFollowing
    setFollowing(nextFollowing)
    setFollowerCount(Math.max(0, nextFollowing ? prevCount + 1 : prevCount - 1))
    setIsLoading(true)

    try {
      if (onFollowToggle) {
        const result = await onFollowToggle(id, prevFollowing)
        if (result === false) {
          throw new Error("Failed to toggle follow")
        }
        if (typeof result === "number") {
          setFollowerCount(Math.max(0, result))
        } else if (result && typeof result === "object") {
          if (typeof result.followerCount === "number") {
            setFollowerCount(Math.max(0, result.followerCount))
          }
          if (typeof result.following === "boolean") {
            setFollowing(result.following)
          }
        }
      }
    } catch {
      setFollowing(prevFollowing)
      setFollowerCount(prevCount)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.cardContainer} testID={`compact-creator-card-${id}`}>
      {avatarUrl && !avatarError ? (
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatarImage}
          onError={() => setAvatarError(true)}
          accessibilityLabel={`${displayName} avatar`}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.displayName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.slug} numberOfLines={1}>
          @{slug}
        </Text>
        <Text style={styles.followers}>{followerCount} followers</Text>
      </View>
      <TouchableOpacity
        style={[styles.followButton, following ? styles.followingButton : styles.notFollowingButton]}
        onPress={handlePressFollow}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={`${following ? "Unfollow" : "Follow"} ${displayName}`}
        accessibilityState={{ disabled: isLoading, busy: isLoading, selected: following }}
        testID={`follow-toggle-btn-${id}`}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={[styles.followButtonText, following ? styles.followingText : styles.notFollowingText]}>
            {following ? "Following" : "Follow"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#1e293b",
    borderRadius: 8,
    marginVertical: 4,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#334155",
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  displayName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  slug: {
    color: "#94a3b8",
    fontSize: 13,
  },
  followers: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  notFollowingButton: {
    backgroundColor: "#6366f1",
  },
  followingButton: {
    backgroundColor: "#334155",
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  notFollowingText: {
    color: "#ffffff",
  },
  followingText: {
    color: "#cbd5e1",
  },
})
