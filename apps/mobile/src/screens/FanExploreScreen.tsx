import React, { useState } from "react"
import { View, FlatList, RefreshControl, Text, StyleSheet, ActivityIndicator } from "react-native"
import { CompactCreatorCard } from "../components/CompactCreatorCard"

export interface CreatorItem {
  id: string
  displayName: string
  slug: string
  avatarUrl?: string | null
  followerCount: number
  isFollowing?: boolean
}

export interface FanExploreScreenProps {
  initialCreators?: CreatorItem[]
  onFetchMore?: () => Promise<CreatorItem[]>
  onRefresh?: () => Promise<CreatorItem[]>
  onFollowToggle?: (creatorId: string, currentStatus: boolean) => Promise<boolean>
}

export function FanExploreScreen({
  initialCreators = [],
  onFetchMore,
  onRefresh,
  onFollowToggle,
}: FanExploreScreenProps) {
  const [creators, setCreators] = useState<CreatorItem[]>(initialCreators)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setHasMore(true)
    try {
      if (onRefresh) {
        const fresh = await onRefresh()
        setCreators(fresh)
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleEndReached = async () => {
    if (isLoadingMore || !hasMore || !onFetchMore) return
    setIsLoadingMore(true)
    try {
      const more = await onFetchMore()
      if (more.length === 0) {
        setHasMore(false)
      } else {
        setCreators((prev) => [...prev, ...more])
      }
    } finally {
      setIsLoadingMore(false)
    }
  }

  const isInitialLoading = creators.length === 0 && (isRefreshing || isLoadingMore)

  return (
    <View style={styles.container} testID="fan-explore-screen">
      <FlatList
        data={creators}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CompactCreatorCard
            id={item.id}
            displayName={item.displayName}
            slug={item.slug}
            avatarUrl={item.avatarUrl}
            followerCount={item.followerCount}
            isFollowing={item.isFollowing}
            onFollowToggle={onFollowToggle}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
            testID="explore-refresh-control"
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={<Text style={styles.headerTitle}>Explore Creators</Text>}
        ListEmptyComponent={
          isInitialLoading ? (
            <ActivityIndicator style={{ marginVertical: 24 }} color="#6366f1" />
          ) : (
            <View style={styles.emptyContainer} testID="explore-empty-state">
              <Text style={styles.emptyTitle}>No creators to show</Text>
              <Text style={styles.emptySubtitle}>Pull down to refresh and try again.</Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator style={{ marginVertical: 16 }} size="small" color="#6366f1" />
          ) : !hasMore && creators.length > 0 ? (
            <Text style={{ textAlign: "center", color: "#64748b", marginVertical: 16, fontSize: 14 }} testID="no-more-results">
              No more results
            </Text>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginVertical: 16,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
  },
})
