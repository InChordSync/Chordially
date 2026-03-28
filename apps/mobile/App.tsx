import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chordially Mobile</Text>
      <Text style={styles.subtitle}>
        Drop a chord and support artists in real time.
      </Text>
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
  }
});
