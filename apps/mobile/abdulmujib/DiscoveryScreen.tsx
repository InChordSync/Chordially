import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type SessionStatus = "live" | "upcoming";

interface Session {
  id: string;
  artistName: string;
  title: string;
  status: SessionStatus;
  genre: string;
  startTime: string;
}

const FILTERS: SessionStatus[] = ["live", "upcoming"];

// Placeholder fetch — replace with real API call when backend is ready
async function fetchSessions(filter: SessionStatus): Promise<Session[]> {
  return [
    {
      id: "1",
      artistName: "Amara Waves",
      title: "Late Night Jazz",
      status: "live",
      genre: "Jazz",
      startTime: new Date().toISOString(),
    },
    {
      id: "2",
      artistName: "DJ Kole",
      title: "Afrobeats Hour",
      status: "upcoming",
      genre: "Afrobeats",
      startTime: new Date(Date.now() + 3600_000).toISOString(),
    },
  ].filter((s) => s.status === filter);
}

export default function DiscoveryScreen() {
  const [filter, setFilter] = useState<SessionStatus>("live");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (status: SessionStatus) => {
    const data = await fetchSessions(status);
    setSessions(data);
  }, []);

  useEffect(() => {
    setLoading(true);
    load(filter).finally(() => setLoading(false));
  }, [filter, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(filter);
    setRefreshing(false);
  }, [filter, load]);

  return (
    <View style={s.root}>
      <Text style={s.heading}>Discover Sessions</Text>

      {/* Filter tabs */}
      <View style={s.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, filter === f && s.filterBtnActive]}
            onPress={() => setFilter(f)}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === f }}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#a78bfa" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a78bfa" />
          }
          ListEmptyComponent={
            <Text style={s.empty}>No {filter} sessions right now.</Text>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.artist}>{item.artistName}</Text>
                <View style={[s.badge, item.status === "live" && s.badgeLive]}>
                  <Text style={s.badgeText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.genre}>{item.genre}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#0b0b0f", paddingTop: 56, paddingHorizontal: 16 },
  heading:         { color: "#f4f0ff", fontSize: 22, fontWeight: "700", marginBottom: 16 },
  filters:         { flexDirection: "row", gap: 8, marginBottom: 16 },
  filterBtn:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#1c1c26" },
  filterBtnActive: { backgroundColor: "#7c3aed" },
  filterText:      { color: "#c7c1d9", fontSize: 14, fontWeight: "600" },
  filterTextActive:{ color: "#fff" },
  card:            { backgroundColor: "#1c1c26", borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  artist:          { color: "#f4f0ff", fontSize: 15, fontWeight: "700" },
  badge:           { backgroundColor: "#374151", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeLive:       { backgroundColor: "#7c3aed" },
  badgeText:       { color: "#fff", fontSize: 11, fontWeight: "700" },
  title:           { color: "#c7c1d9", fontSize: 14, marginBottom: 2 },
  genre:           { color: "#6b7280", fontSize: 12 },
  empty:           { color: "#6b7280", textAlign: "center", marginTop: 40, fontSize: 15 },
});
