import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

interface Reward {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

function RewardCard({ reward }: { reward: Reward }) {
  return (
    <View style={[styles.card, !reward.unlocked && styles.locked]}>
      <Text style={styles.name}>{reward.name}</Text>
      <Text style={styles.desc}>
        {reward.unlocked ? reward.description : "Locked"}
      </Text>
    </View>
  );
}

export function RewardsGallery({ rewards }: { rewards: Reward[] }) {
  return (
    <FlatList
      data={rewards}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => <RewardCard reward={item} />}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: { padding: 16, marginBottom: 12, borderRadius: 8, backgroundColor: "#f5f5f5" },
  locked: { opacity: 0.5 },
  name: { fontWeight: "bold", fontSize: 16 },
  desc: { color: "#666", marginTop: 4 },
});
