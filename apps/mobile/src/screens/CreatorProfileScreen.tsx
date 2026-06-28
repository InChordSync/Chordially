import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native"
import {
  getCreatorBySlug,
  type CreatorProfile,
} from "../services/creator-service"
import { apiFetch } from "../services/api-client"
import FollowCountSummary from "../components/FollowCountSummary"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; profile: CreatorProfile; followCount: { followers: number; following: number } }

interface Props {
  slug: string
}

export default function CreatorProfileScreen({ slug }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" })

  const load = useCallback(async () => {
    try {
      const [profile, followCount] = await Promise.all([
        getCreatorBySlug(slug),
        apiFetch<{ followers: number; following: number }>(
          `/api/creators/${encodeURIComponent(slug)}/follow-count`
        ),
      ])
      setState({ status: "ok", profile, followCount })
    } catch {
      setState({ status: "error", message: "Creator not found" })
    }
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  if (state.status === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator testID="loading-indicator" size="large" />
      </View>
    )
  }

  if (state.status === "error") {
    return (
      <View style={styles.center}>
        <Text>{state.message}</Text>
      </View>
    )
  }

  const { profile, followCount } = state

  return (
    <View style={styles.container}>
      {profile.avatarUrl ? (
        <Image
          source={{ uri: profile.avatarUrl }}
          style={styles.avatar}
          accessibilityLabel={`${profile.displayName}'s avatar`}
        />
      ) : (
        <View
          style={[styles.avatar, styles.placeholderAvatar]}
          accessibilityLabel="Default avatar"
        />
      )}

      <Text style={styles.displayName}>{profile.displayName}</Text>

      <FollowCountSummary
        followerCount={followCount.followers}
        followingCount={followCount.following}
      />

      {profile.isVerified && <Text accessibilityLabel="Verified">Verified</Text>}

      {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      {profile.genre && (
        <Text style={styles.detail}>Genre: {profile.genre}</Text>
      )}

      {profile.location && (
        <Text style={styles.detail}>Location: {profile.location}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  placeholderAvatar: {
    backgroundColor: "#ddd",
  },
  displayName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  detail: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
})
