import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { ApiError, NetworkError } from "../services/api-client"
import {
  getCreatorBySlug,
  type CreatorProfile,
} from "../services/creator-service"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string; kind: "not-found" | "offline" | "generic" }
  | { status: "ok"; profile: CreatorProfile }

interface Props {
  slug: string
}

export default function CreatorProfileScreen({ slug }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (active?: () => boolean) => {
    setState({ status: "loading" })
    try {
      const profile = await getCreatorBySlug(slug)
      if (active && !active()) return
      setState({ status: "ok", profile })
    } catch (error) {
      if (active && !active()) return
      if (error instanceof NetworkError) {
        setState({ status: "error", kind: "offline", message: "You appear to be offline. Check your connection and try again." })
        return
      }
      if (error instanceof ApiError && error.status === 404) {
        setState({ status: "error", kind: "not-found", message: "Creator not found" })
        return
      }
      setState({ status: "error", kind: "generic", message: "Could not load this creator profile." })
    }
  }, [slug])

  useEffect(() => {
    let mounted = true
    const active = () => mounted
    void load(active)
    return () => {
      mounted = false
    }
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await load()
    } finally {
      setRefreshing(false)
    }
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
      <ScrollView
        contentContainerStyle={styles.center}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.errorText}>{state.message}</Text>
        <Pressable onPress={() => void load()} style={styles.retryButton} testID="profile-retry-btn">
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </ScrollView>
    )
  }

  const { profile } = state
  const nameLabel = profile.isVerified ? `${profile.displayName}, verified creator` : profile.displayName

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
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

      <Text style={styles.displayName} accessibilityLabel={nameLabel}>
        {profile.displayName}
        {profile.isVerified ? (
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants"> Verified</Text>
        ) : null}
      </Text>

      {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      {profile.genre && (
        <Text style={styles.detail}>Genre: {profile.genre}</Text>
      )}

      {profile.location && (
        <Text style={styles.detail}>Location: {profile.location}</Text>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  container: {
    flex: 1,
  },
  content: {
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
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#6366f1",
    borderRadius: 8,
  },
  retryText: {
    color: "#ffffff",
    fontWeight: "600",
  },
})
