// #106 – React Native app architecture with navigation and state boundaries
import { createContext, useContext, useState, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import DiscoveryScreen from "../abdulmujib/DiscoveryScreen";
import NotificationsScreen from "../bellabuks/NotificationsScreen";
import ArtistDashboardScreen from "./ArtistDashboardScreen";
import LegalScreen from "./LegalScreen";

// ── Auth state boundary ────────────────────────────────────────────────────

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  role: "fan" | "artist" | null;
}

const AuthContext = createContext<AuthState>({ isAuthenticated: false, userId: null, role: null });
export const useAppAuth = () => useContext(AuthContext);

// ── Route definitions ──────────────────────────────────────────────────────

type Screen = "Discover" | "Notifications" | "Legal" | "ArtistDashboard";

const TAB_SCREENS: Screen[] = ["Discover", "Notifications", "Legal"];

const TAB_LABELS: Record<Screen, string> = {
  Discover: "Discover",
  Notifications: "Alerts",
  Legal: "Legal",
  ArtistDashboard: "Dashboard",
};

// ── Navigator ─────────────────────────────────────────────────────────────

interface AppNavigatorProps {
  authState: AuthState;
  children?: ReactNode;
}

function renderScreen(screen: Screen) {
  switch (screen) {
    case "Discover":       return <DiscoveryScreen />;
    case "Notifications":  return <NotificationsScreen />;
    case "Legal":          return <LegalScreen />;
    case "ArtistDashboard": return <ArtistDashboardScreen />;
  }
}

export function AppNavigator({ authState }: AppNavigatorProps) {
  const [current, setCurrent] = useState<Screen>("Discover");

  const tabs: Screen[] = authState.isAuthenticated && authState.role === "artist"
    ? [...TAB_SCREENS, "ArtistDashboard"]
    : TAB_SCREENS;

  return (
    <AuthContext.Provider value={authState}>
      <SafeAreaView style={styles.container}>
        {/* Screen content */}
        <View style={styles.content}>
          {renderScreen(current)}
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar} accessibilityRole="tablist">
          {tabs.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setCurrent(s)}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: current === s }}
              accessibilityLabel={TAB_LABELS[s]}
            >
              <Text style={[styles.tabText, current === s && styles.tabActive]}>
                {TAB_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0f" },
  content:   { flex: 1 },
  tabBar:    { flexDirection: "row", backgroundColor: "#16131f", paddingVertical: 10, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: "#2e2b3a" },
  tab:       { flex: 1, alignItems: "center" },
  tabText:   { color: "#8a84a0", fontSize: 12 },
  tabActive: { color: "#7c5cfc", fontWeight: "700" },
});
