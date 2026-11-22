import React, { useCallback, useState } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native"
import { StatusBar } from "expo-status-bar"

export interface MobileNotification {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export function formatNotificationTime(createdAt: string, now = Date.now()): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return createdAt

  const diffMs = date.getTime() - now
  const diffSeconds = Math.round(diffMs / 1000)
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  const absSeconds = Math.abs(diffSeconds)

  if (absSeconds < 60) return rtf.format(diffSeconds, "second")
  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute")
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour")
  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day")

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export interface NotificationsInboxScreenProps {
  initialNotifications?: MobileNotification[]
  onMarkAllRead?: () => void
}

export function NotificationsInboxScreen({
  initialNotifications = [],
  onMarkAllRead,
}: NotificationsInboxScreenProps) {
  const [notifications, setNotifications] = useState<MobileNotification[]>(initialNotifications)
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL")

  const handleToggleRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: !item.read } : item))
    )
  }, [])

  const handleMarkAll = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    onMarkAllRead?.()
  }, [onMarkAllRead])

  const filteredNotifications = notifications.filter((n) =>
    filter === "UNREAD" ? !n.read : true
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  const renderItem = useCallback(({ item }: { item: MobileNotification }) => (
    <TouchableOpacity
      style={[styles.notifItem, item.read ? styles.notifRead : styles.notifUnread]}
      onPress={() => handleToggleRead(item.id)}
      testID={`mobile-notif-item-${item.id}`}
    >
      <View style={styles.notifHeader}>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <View style={[styles.statusDot, item.read ? styles.dotRead : styles.dotUnread]} />
      </View>
      <Text style={styles.notifBody}>{item.body}</Text>
      <Text style={styles.notifTime}>{item.createdAt}</Text>
    </TouchableOpacity>
  ), [handleToggleRead])

  return (
    <View style={styles.container} testID="notifications-inbox-screen">
      <StatusBar style="light" />
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Notifications ({unreadCount} unread)</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAll}
            testID="mark-all-read-btn"
          >
            <Text style={styles.markAllBtnText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === "ALL" && styles.filterChipActive]}
          accessibilityLabel="Show all notifications"
          onPress={() => setFilter("ALL")}
          testID="filter-all-btn"
        >
          <Text style={[styles.filterChipText, filter === "ALL" && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === "UNREAD" && styles.filterChipActive]}
          accessibilityLabel="Show unread notifications"
          onPress={() => setFilter("UNREAD")}
          testID="filter-unread-btn"
        >
          <Text style={[styles.filterChipText, filter === "UNREAD" && styles.filterChipTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer} testID="empty-inbox-state">
          <Text style={styles.emptyText}>No notifications in this view.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          windowSize={7}
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  markAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
  },
  markAllBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#1e293b",
  },
  filterChipActive: {
    backgroundColor: "#6366f1",
  },
  filterChipText: {
    color: "#94a3b8",
    fontSize: 13,
  },
  filterChipTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
  },
  notifItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  notifUnread: {
    backgroundColor: "#1e293b",
    borderLeftWidth: 4,
    borderLeftColor: "#6366f1",
  },
  notifRead: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotUnread: {
    backgroundColor: "#6366f1",
  },
  dotRead: {
    backgroundColor: "transparent",
  },
  notifBody: {
    color: "#cbd5e1",
    fontSize: 13,
    marginTop: 4,
  },
  notifTime: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 6,
  },
})
