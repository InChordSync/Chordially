import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import {
  getCreatorBySlug,
  type CreatorProfile,
} from "../services/creator-service"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; profile: CreatorProfile }

interface Props {
  slug: string
}

export default function CreatorProfileScreen({ slug }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const profile = await getCreatorBySlug(slug)
      setState({ status: "ok", profile })
    } catch {
      setState({ status: "error", message: "Creator not found" })
    }
  }, [slug])

  useEffect(() => {
    void load()
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
      <ScrollView contentContainerStyle={styles.center} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text>{state.message}</Text>
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
})
