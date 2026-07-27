import React, { useState } from "react"
import { View, FlatList, RefreshControl, Text, StyleSheet, ActivityIndicator } from "react-native"
import { CompactCreatorCard } from "../components/CompactCreatorCard"

export interface CreatorItem {
  id: string
  displayName: string
  slug: string
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

  const handleRefresh = async () => {
    setIsRefreshing(true)
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
    if (isLoadingMore || !onFetchMore) return
    setIsLoadingMore(true)
    try {
      const more = await onFetchMore()
      setCreators((prev) => [...prev, ...more])
    } finally {
      setIsLoadingMore(false)
    }
  }

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
    padding: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
})
