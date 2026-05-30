import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { createMobileAuthStore } from "./src/auth/mobile-auth-store";

const authStore = createMobileAuthStore();

export default function App() {
  const [state, setState] = useState(authStore.getState());

  useEffect(() => authStore.subscribe(setState), []);
  useEffect(() => {
    authStore.boot({
      sessionId: "session-mobile-1",
      sessions: [
        { id: "session-mobile-1", device: "Pixel 7", lastSeen: "just now" },
        { id: "session-mobile-2", device: "iPhone 14", lastSeen: "2h ago" },
      ],
    });
  }, []);

  if (state.isBooting) {
    return <View style={styles.container}><Text style={styles.title}>Booting auth…</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chordially Mobile</Text>
      <Text style={styles.subtitle}>
        {state.isAuthenticated ? "Signed in" : "Signed out"} · {state.isOffline ? "Offline" : "Online"}
      </Text>
      <Pressable style={styles.button} onPress={() => authStore.setOffline(!state.isOffline)}>
        <Text style={styles.buttonText}>{state.isOffline ? "Go Online" : "Go Offline"}</Text>
      </Pressable>
      <Text style={styles.sectionTitle}>Device Sessions</Text>
      {state.sessions.map((session) => (
        <View style={styles.sessionRow} key={session.id}>
          <Text style={styles.sessionText}>{session.device} · {session.lastSeen}</Text>
          <Pressable style={styles.revokeBtn} onPress={() => authStore.revokeSession(session.id)}>
            <Text style={styles.revokeText}>Revoke</Text>
          </Pressable>
        </View>
      ))}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0f",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  title: {
    color: "#f4f0ff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12
  },
  subtitle: {
    color: "#c7c1d9",
    fontSize: 16,
    textAlign: "center"
  },
  sectionTitle: {
    color: "#f4f0ff",
    marginTop: 20,
    marginBottom: 8,
    fontWeight: "600",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#7c3aed",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  sessionRow: {
    marginTop: 8,
    width: "100%",
    maxWidth: 320,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionText: {
    color: "#c7c1d9",
    fontSize: 14,
  },
  revokeBtn: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  revokeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  }
});
