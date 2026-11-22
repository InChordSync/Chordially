import React, { useCallback, useEffect, useState } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native"
import { StatusBar } from "expo-status-bar"
import { CompactCreatorCard } from "../components/CompactCreatorCard"

let globalSavedCreatorsCache: SavedCreatorItem[] | null = null;

export interface SavedCreatorItem {
  id: string
  displayName: string
  slug: string
  followerCount: number
  isFollowing?: boolean
}

export interface SavedCreatorsScreenProps {
  initialSavedCreators?: SavedCreatorItem[]
  onRemoveBookmark?: (creatorId: string) => void
  onFollowToggle?: (creatorId: string, currentStatus: boolean) => Promise<boolean>
}

export function SavedCreatorsScreen({
  initialSavedCreators = [],
  onRemoveBookmark,
  onFollowToggle,
}: SavedCreatorsScreenProps) {
  const [savedCreators, setSavedCreators] = useState<SavedCreatorItem[]>(() => {
    if (globalSavedCreatorsCache !== null) {
      return globalSavedCreatorsCache;
    }
    return initialSavedCreators;
  });

  useEffect(() => {
    globalSavedCreatorsCache = savedCreators;
  }, [savedCreators]);

  const handleRemove = useCallback((creatorId: string) => {
    setSavedCreators((prev) => prev.filter((item) => item.id !== creatorId))
    onRemoveBookmark?.(creatorId)
  }, [onRemoveBookmark])

  const renderItem = useCallback(({ item }: { item: SavedCreatorItem }) => (
    <View style={styles.cardWrapper}>
      <View style={{ flex: 1 }}>
        <CompactCreatorCard
          id={item.id}
          displayName={item.displayName}
          slug={item.slug}
          followerCount={item.followerCount}
          isFollowing={item.isFollowing}
          onFollowToggle={onFollowToggle}
        />
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => handleRemove(item.id)}
        testID={`remove-saved-btn-${item.id}`}
      >
        <Text style={styles.removeBtnText}>Remove</Text>
      </TouchableOpacity>
    </View>
  ), [handleRemove, onFollowToggle])

  return (
    <View style={styles.container} testID="saved-creators-screen">
      <StatusBar style="light" />
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
          renderItem={renderItem}
          windowSize={7}
          removeClippedSubviews
        />
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
})
