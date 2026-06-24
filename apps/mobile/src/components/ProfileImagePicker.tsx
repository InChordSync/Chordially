import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useImagePicker } from "../hooks/useImagePicker"

interface Props {
  currentAvatarUrl: string | null
  onImagePicked: (uri: string, mimeType: string) => void
}

export default function ProfileImagePicker({
  currentAvatarUrl,
  onImagePicked,
}: Props) {
  const { image, error, pickImage } = useImagePicker()

  const displayUri = image?.uri ?? currentAvatarUrl

  async function handlePress() {
    const picked = await pickImage()
    if (picked) {
      onImagePicked(picked.uri, picked.mimeType)
    }
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel="Pick profile image">
        {displayUri ? (
          <Image
            source={{ uri: displayUri }}
            style={styles.avatar}
            accessibilityLabel="Profile avatar"
          />
        ) : (
          <View style={[styles.avatar, styles.placeholder]}>
            <Text style={styles.placeholderText}>+</Text>
          </View>
        )}
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.hint}>Tap to change photo</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholder: {
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 36,
    color: "#999",
  },
  error: {
    color: "red",
    marginTop: 8,
    fontSize: 14,
  },
  hint: {
    marginTop: 8,
    fontSize: 14,
    color: "#888",
  },
})
