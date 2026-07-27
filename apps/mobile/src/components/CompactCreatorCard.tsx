import React, { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native"

export interface CompactCreatorCardProps {
  id: string
  displayName: string
  slug: string
  followerCount: number
  isFollowing?: boolean
  onFollowToggle?: (creatorId: string, currentFollowing: boolean) => Promise<boolean>
}

export function CompactCreatorCard({
  id,
  displayName,
  slug,
  followerCount: initialFollowerCount,
  isFollowing: initialIsFollowing = false,
  onFollowToggle,
}: CompactCreatorCardProps) {
  const [following, setFollowing] = useState(initialIsFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [isLoading, setIsLoading] = useState(false)

  const handlePressFollow = async () => {
    if (isLoading) return

    const prevFollowing = following
    const prevCount = followerCount

    // Local optimistic update
    const nextFollowing = !prevFollowing
    setFollowing(nextFollowing)
    setFollowerCount(nextFollowing ? prevCount + 1 : prevCount - 1)
    setIsLoading(true)

    try {
      if (onFollowToggle) {
        const success = await onFollowToggle(id, prevFollowing)
        if (!success) {
          throw new Error("Failed to toggle follow")
        }
      }
    } catch {
      // Local optimistic rollback on error (#690)
      setFollowing(prevFollowing)
      setFollowerCount(prevCount)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.cardContainer} testID={`compact-creator-card-${id}`}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
      </View>
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
