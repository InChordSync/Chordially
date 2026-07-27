import { useState } from "react"
import * as ImagePicker from "expo-image-picker"

export type ProfileMediaSlot = "avatar" | "banner"

export interface PickedProfileMedia {
  slot: ProfileMediaSlot
  uri: string
  mimeType: string
}

/**
 * Picks an image for either the avatar or banner slot, using a different
 * aspect ratio per slot so banners don't get force-cropped to a square.
 */
export function useProfileMediaPicker() {
  const [error, setError] = useState<string | null>(null)

  async function pick(slot: ProfileMediaSlot): Promise<PickedProfileMedia | null> {
    setError(null)

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError("Permission to access photos was denied")
      return null
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: slot === "avatar" ? [1, 1] : [3, 1],
      quality: 0.8,
    })

    if (result.canceled || result.assets.length === 0) return null

    const asset = result.assets[0]!
    return { slot, uri: asset.uri, mimeType: asset.mimeType ?? "image/jpeg" }
  }

  return { error, pick }
}
