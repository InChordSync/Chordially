import { StyleSheet, Text, View } from "react-native"

interface Props {
  followerCount: number
  followingCount: number
  showLabels?: boolean
}

export default function FollowCountSummary({
  followerCount,
  followingCount,
  showLabels = true,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.count}>{followerCount.toLocaleString()}</Text>
      {showLabels && <Text style={styles.label}> followers</Text>}
      <Text style={styles.separator}> · </Text>
      <Text style={styles.count}>{followingCount.toLocaleString()}</Text>
      {showLabels && <Text style={styles.label}> following</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  count: {
    fontWeight: "600",
    color: "#333",
    fontSize: 14,
  },
  label: {
    color: "#888",
    fontSize: 14,
  },
  separator: {
    color: "#ccc",
    marginHorizontal: 4,
    fontSize: 14,
  },
})
