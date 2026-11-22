import React, { useCallback, useEffect, useState } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native"
import { CompactCreatorCard } from "../components/CompactCreatorCard"

export interface SavedCreatorItem {
  id: string
  displayName: string
  slug: string
  avatarUrl?: string | null
  followerCount: number
  isFollowing?: boolean
}

export interface SavedCreatorsScreenProps {
  initialSavedCreators?: SavedCreatorItem[]
  onRemoveBookmark?: (creatorId: string) => void | Promise<void>
  onFollowToggle?: (creatorId: string, currentStatus: boolean) => Promise<boolean>
}

export function SavedCreatorsScreen({
  initialSavedCreators = [],
  onRemoveBookmark,
  onFollowToggle,
}: SavedCreatorsScreenProps) {
  const [savedCreators, setSavedCreators] = useState<SavedCreatorItem[]>(initialSavedCreators)
  const [recentlyRemoved, setRecentlyRemoved] = useState<SavedCreatorItem | null>(null)

  useEffect(() => {
    setSavedCreators(initialSavedCreators)
  }, [initialSavedCreators])

  const handleRemove = useCallback((creatorId: string) => {
    const item = savedCreators.find((c) => c.id === creatorId)
    if (!item) return

    setSavedCreators((prev) => prev.filter((c) => c.id !== creatorId))
    setRecentlyRemoved(item)

    try {
      const result = onRemoveBookmark?.(creatorId)
      if (result && typeof (result as Promise<void>).then === "function") {
        void (result as Promise<void>).catch(() => {
          setSavedCreators((prev) => [item, ...prev.filter((c) => c.id !== item.id)])
          setRecentlyRemoved(null)
        })
      }
    } catch {
      setSavedCreators((prev) => [item, ...prev.filter((c) => c.id !== item.id)])
      setRecentlyRemoved(null)
    }
  }, [onRemoveBookmark, savedCreators])

  const handleUndo = useCallback(() => {
    if (!recentlyRemoved) return
    setSavedCreators((prev) => [recentlyRemoved, ...prev.filter((c) => c.id !== recentlyRemoved.id)])
    setRecentlyRemoved(null)
  }, [recentlyRemoved])

  return (
    <View style={styles.container} testID="saved-creators-screen">
      <Text style={styles.headerTitle}>Saved Creators</Text>

      {savedCreators.length === 0 ? (
        <View style={styles.emptyContainer} testID="empty-saved-creators-state">
          <Text style={styles.emptyTitle}>No saved creators</Text>
          <Text style={styles.emptySubtitle}>Bookmark your favorite creators during discovery to view them here.</Text>
        </View>
      ) : (
        <FlatList
          data={savedCreators}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <View style={{ flex: 1 }}>
                <CompactCreatorCard
                  id={item.id}
                  displayName={item.displayName}
                  slug={item.slug}
                  avatarUrl={item.avatarUrl}
                  followerCount={item.followerCount}
                  isFollowing={item.isFollowing}
                  onFollowToggle={onFollowToggle}
                />
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => void handleRemove(item.id)}
                accessibilityLabel={`Remove ${item.displayName} from saved`}
                testID={`remove-saved-btn-${item.id}`}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {recentlyRemoved && (
        <View style={styles.snackbar} testID="saved-remove-snackbar">
          <Text style={styles.snackbarText}>Removed {recentlyRemoved.displayName}</Text>
          <TouchableOpacity onPress={handleUndo} testID="undo-remove-saved">
            <Text style={styles.snackbarUndo}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e2e8f0",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  cardWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  removeBtn: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#ef4444",
    borderRadius: 6,
  },
  removeBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  snackbar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  snackbarText: { color: "#ffffff", fontSize: 13 },
  snackbarUndo: { color: "#93c5fd", fontWeight: "700", fontSize: 13 },
})
