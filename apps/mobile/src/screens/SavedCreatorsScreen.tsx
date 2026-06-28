import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { getBookmarks, removeBookmark } from "../services/bookmark-service"
import CompactCreatorCard from "../components/CompactCreatorCard"
import type { CreatorCardData } from "../components/CompactCreatorCard"
import type { BookmarkEntry } from "@chordially/shared"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; items: BookmarkEntry[] }

interface Props {
  token: string
  onCreatorPress: (slug: string) => void
}

export default function SavedCreatorsScreen({ token, onCreatorPress }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const result = await getBookmarks(token)
      setState({ status: "ok", items: result.bookmarks })
    } catch {
      setState({ status: "error", message: "Failed to load saved creators" })
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const result = await getBookmarks(token)
      setState({ status: "ok", items: result.bookmarks })
    } catch {
      setState({ status: "error", message: "Failed to load saved creators" })
    } finally {
      setRefreshing(false)
    }
  }, [token])

  const handleRemoveBookmark = useCallback(
    async (slug: string) => {
      try {
        await removeBookmark(slug, token)
        setState((prev) => {
          if (prev.status !== "ok") return prev
          return {
            ...prev,
            items: prev.items.filter((b) => b.creator.slug !== slug),
          }
        })
      } catch {
        // silently fail
      }
    },
    [token]
  )

  const handleCreatorPress = useCallback(
    (slug: string) => {
      onCreatorPress(slug)
    },
    [onCreatorPress]
  )

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
        <TouchableOpacity onPress={load} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (state.items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No saved creators</Text>
        <Text style={styles.emptySubtitle}>
          You haven&apos;t saved any creators yet
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={state.items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const creator: CreatorCardData = {
          id: item.creator.id,
          slug: item.creator.slug,
          displayName: item.creator.displayName,
          avatarUrl: item.creator.avatarUrl,
          genre: item.creator.genre,
          location: item.creator.location,
          isVerified: item.creator.isVerified,
          followerCount: 0,
        }
        return (
          <View style={styles.cardRow}>
            <View style={styles.cardWrapper}>
              <CompactCreatorCard
                creator={creator}
                onPress={handleCreatorPress}
                isFollowing={false}
                onFollowToggle={() => {}}
              />
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveBookmark(item.creator.slug)}
              accessibilityLabel={`Remove ${item.creator.displayName} from saved`}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )
      }}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={styles.list}
    />
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  list: {
    paddingBottom: 20,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardWrapper: {
    flex: 1,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removeButtonText: {
    color: "#e74c3c",
    fontSize: 13,
    fontWeight: "600",
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#4a90d9",
    borderRadius: 6,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
})
