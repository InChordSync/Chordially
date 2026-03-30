import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type TipStatus = "idle" | "pending" | "success" | "failed";

interface SessionInfo {
  id: string;
  artistName: string;
  title: string;
  genre: string;
  isLive: boolean;
}

// Placeholder session data — replace with route params / API call
const SESSION: SessionInfo = {
  id: "1",
  artistName: "Amara Waves",
  title: "Late Night Jazz",
  genre: "Jazz",
  isLive: true,
};

// Placeholder tip submit — wire to real payment service when ready
async function submitTip(_sessionId: string, _amount: string): Promise<void> {
  await new Promise((res) => setTimeout(res, 1200));
  // Throw new Error("payment failed") to test failure path
}

export default function SessionDetailScreen() {
  const [amount, setAmount] = useState("");
  const [tipStatus, setTipStatus] = useState<TipStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleTip = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      Alert.alert("Invalid amount", "Please enter a positive tip amount.");
      return;
    }

    setTipStatus("pending");
    setErrorMsg("");

    try {
      await submitTip(SESSION.id, amount);
      setTipStatus("success");
      setAmount("");
    } catch {
      setTipStatus("failed");
      setErrorMsg("Payment failed. Please try again.");
    }
  };

  const handleRetry = () => {
    setTipStatus("idle");
    setErrorMsg("");
  };

  return (
    <View style={s.root}>
      {/* Session info */}
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.artist}>{SESSION.artistName}</Text>
          {SESSION.isLive && (
            <View style={s.liveBadge}>
              <Text style={s.liveBadgeText}>LIVE</Text>
            </View>
          )}
        </View>
        <Text style={s.title}>{SESSION.title}</Text>
        <Text style={s.genre}>{SESSION.genre}</Text>
      </View>

      {/* Tip flow */}
      <View style={s.tipBox}>
        <Text style={s.tipHeading}>Send a Tip (XLM)</Text>

        {tipStatus === "success" ? (
          <View style={s.successBox}>
            <Text style={s.successText}>🎵 Tip sent successfully!</Text>
          </View>
        ) : (
          <>
            <TextInput
              style={s.input}
              placeholder="Amount (e.g. 10)"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={tipStatus !== "pending"}
            />

            {tipStatus === "failed" && (
              <Text style={s.errorText}>{errorMsg}</Text>
            )}

            <TouchableOpacity
              style={[s.btn, tipStatus === "pending" && s.btnDisabled]}
              onPress={tipStatus === "failed" ? handleRetry : handleTip}
              disabled={tipStatus === "pending"}
              accessibilityRole="button"
            >
              {tipStatus === "pending" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnText}>
                  {tipStatus === "failed" ? "Retry" : "Send Tip"}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: "#0b0b0f", paddingTop: 56, paddingHorizontal: 16 },
  card:          { backgroundColor: "#1c1c26", borderRadius: 12, padding: 16, marginBottom: 24 },
  row:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  artist:        { color: "#f4f0ff", fontSize: 18, fontWeight: "700" },
  liveBadge:     { backgroundColor: "#7c3aed", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  liveBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  title:         { color: "#c7c1d9", fontSize: 15, marginBottom: 2 },
  genre:         { color: "#6b7280", fontSize: 13 },
  tipBox:        { backgroundColor: "#1c1c26", borderRadius: 12, padding: 16 },
  tipHeading:    { color: "#f4f0ff", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  input:         { backgroundColor: "#0b0b0f", color: "#f4f0ff", borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: "#2d2d3a" },
  btn:           { backgroundColor: "#7c3aed", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  btnDisabled:   { opacity: 0.6 },
  btnText:       { color: "#fff", fontWeight: "700", fontSize: 16 },
  errorText:     { color: "#f87171", fontSize: 13, marginBottom: 8 },
  successBox:    { padding: 16, alignItems: "center" },
  successText:   { color: "#86efac", fontSize: 16, fontWeight: "600" },
});
