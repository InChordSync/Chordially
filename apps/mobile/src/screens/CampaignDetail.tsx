import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

interface Campaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  current: number;
  deadline: string;
  creatorName: string;
}

export function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const percent = Math.min(100, Math.round((campaign.current / campaign.goal) * 100));
  const daysLeft = Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / 86400000);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.creator}>{campaign.creatorName}</Text>
      <Text style={styles.title}>{campaign.title}</Text>
      <Text style={styles.desc}>{campaign.description}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percent}%` as any }]} />
      </View>
      <Text>{campaign.current} / {campaign.goal} XLM · {percent}%</Text>
      <Text style={styles.deadline}>{daysLeft > 0 ? `${daysLeft} days left` : "Ended"}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  creator: { color: "#6b7280", marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  desc: { color: "#374151", marginBottom: 16 },
  progressBar: { height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, marginBottom: 8 },
  progressFill: { height: 8, backgroundColor: "#6366f1", borderRadius: 4 },
  deadline: { color: "#6b7280", marginTop: 8 },
});
