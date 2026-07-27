import { Image, StyleSheet, Text, View } from "react-native"
import type { CreatorProfile } from "../services/creator-service"

interface Props {
  profile: CreatorProfile
}

/**
 * Read-only preview of how a creator's public profile will look to fans,
 * shown during onboarding before the profile goes live.
 */
export default function CreatorProfilePreviewScreen({ profile }: Props) {
  return (
    <View style={styles.container} testID="profile-preview">
      {profile.avatarUrl ? (
        <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder]} />
      )}
      <Text style={styles.name}>{profile.displayName}</Text>
      {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      <Text style={styles.badge}>Public preview</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  placeholder: { backgroundColor: "#ddd" },
  name: { fontSize: 20, fontWeight: "bold" },
  bio: { fontSize: 14, color: "#666", marginTop: 8, textAlign: "center" },
  badge: { marginTop: 16, fontSize: 12, color: "#999" },
})
