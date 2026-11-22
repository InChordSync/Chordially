import React, { useCallback, useState } from "react"
import { View, FlatList, RefreshControl, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native"
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

function mergeUniqueById(prev: CreatorItem[], next: CreatorItem[]): CreatorItem[] {
  const seen = new Set(prev.map((item) => item.id))
  const merged = [...prev]
  for (const item of next) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    merged.push(item)
  }
  return merged
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
  const [loadError, setLoadError] = useState<string | null>(null)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    setHasMore(true)
    setLoadError(null)
    try {
      if (onRefresh) {
        const fresh = await onRefresh()
        setCreators(fresh)
      }
    } catch {
      setLoadError("Could not refresh creators. Pull to retry.")
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh])

  const handleEndReached = useCallback(async () => {
    if (isLoadingMore || !hasMore || !onFetchMore || loadError) return
    setIsLoadingMore(true)
    setLoadError(null)
    try {
      const more = await onFetchMore()
      if (more.length === 0) {
        setHasMore(false)
      } else {
        setCreators((prev) => mergeUniqueById(prev, more))
      }
    } catch {
      setLoadError("Could not load more creators.")
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, loadError, onFetchMore])

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
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator style={{ marginVertical: 16 }} size="small" color="#6366f1" />
          ) : loadError ? (
            <View style={styles.errorFooter} testID="explore-error-footer">
              <Text style={styles.errorText}>{loadError}</Text>
              <TouchableOpacity onPress={handleEndReached} testID="explore-retry-btn">
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
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
  errorFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  retryText: {
    color: "#93c5fd",
    fontSize: 14,
    fontWeight: "600",
  },
})
