import { Image, StyleSheet, View } from "react-native"

interface Props {
  avatarUri: string | null
  bannerUri: string | null
}

/**
 * Shows the picked avatar/banner before upload so the creator can confirm
 * the crop and image look right, without waiting on a network round trip.
 */
export default function AvatarBannerPreview({ avatarUri, bannerUri }: Props) {
  return (
    <View testID="avatar-banner-preview">
      {bannerUri ? (
        <Image source={{ uri: bannerUri }} style={styles.banner} />
      ) : (
        <View style={[styles.banner, styles.placeholder]} />
      )}

      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder]} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  banner: { width: "100%", height: 120 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginTop: -40,
    marginLeft: 16,
  },
  placeholder: { backgroundColor: "#ddd" },
})
