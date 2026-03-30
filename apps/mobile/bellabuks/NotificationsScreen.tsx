// #113 – Mobile notifications center
import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo
} from "react-native";

type NotifType = "tip" | "session" | "system";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const SEED_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "tip", title: "New tip received", body: "Ada Listener tipped you 50 XLM during your session.", time: "2m ago", read: false },
  { id: "n2", type: "session", title: "Session starting soon", body: "Bass Theory goes live in 10 minutes.", time: "8m ago", read: false },
  { id: "n3", type: "system", title: "Wallet verified", body: "Your Stellar wallet has been successfully verified.", time: "1h ago", read: true },
  { id: "n4", type: "tip", title: "New tip received", body: "Jay Beats tipped you 120 XLM.", time: "3h ago", read: true },
  { id: "n5", type: "session", title: "Session ended", body: "Your last session has been archived.", time: "1d ago", read: true }
];

const typeIcon: Record<NotifType, string> = {
  tip: "💸",
  session: "🎵",
  system: "🔔"
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    AccessibilityInfo.announceForAccessibility("All notifications marked as read.");
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>
          Notifications {unreadCount > 0 && <Text style={styles.badge}> {unreadCount}</Text>}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, !item.read && styles.itemUnread]}
            onPress={() => markRead(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.body}. ${item.time}.${!item.read ? " Unread." : ""}`}
            accessibilityState={{ checked: item.read }}
          >
            <Text style={styles.icon} accessibilityElementsHidden>{typeIcon[item.type]}</Text>
            <View style={styles.itemBody}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemText}>{item.body}</Text>
              <Text style={styles.itemTime}>{item.time}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} accessibilityElementsHidden />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.empty}>No notifications yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0f" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24, paddingBottom: 12 },
  heading: { color: "#f4f0ff", fontSize: 22, fontWeight: "700" },
  badge: { color: "#7c5cfc", fontSize: 18 },
  markAll: { color: "#7c5cfc", fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#16131f", borderRadius: 10, padding: 14, marginBottom: 10 },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: "#7c5cfc" },
  icon: { fontSize: 20, marginTop: 2 },
  itemBody: { flex: 1 },
  itemTitle: { color: "#f4f0ff", fontSize: 14, fontWeight: "600", marginBottom: 2 },
  itemText: { color: "#c7c1d9", fontSize: 13, lineHeight: 19 },
  itemTime: { color: "#5a5470", fontSize: 11, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#7c5cfc", marginTop: 6 },
  emptyBox: { alignItems: "center", marginTop: 60 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  empty: { color: "#c7c1d9", fontSize: 16, fontWeight: "600" }
});
