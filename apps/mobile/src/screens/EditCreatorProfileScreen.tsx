import { useRef, useState } from "react"
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

export interface EditableCreatorFields {
  bio: string
  location: string
  socialLink: string
}

interface Props {
  initial: EditableCreatorFields
  onSave: (fields: EditableCreatorFields) => void
}

function normalizeSocialLink(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return ""
  try {
    const url = new URL(trimmed)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    url.protocol = url.protocol.toLowerCase()
    url.hostname = url.hostname.toLowerCase()
    return url.toString()
  } catch {
    return null
  }
}

/** Minimal mobile form for editing bio, location, and one social link. */
export default function EditCreatorProfileScreen({ initial, onSave }: Props) {
  const [fields, setFields] = useState(initial)
  const [socialLinkError, setSocialLinkError] = useState<string | null>(null)
  const socialLinkRef = useRef<TextInput>(null)

  const update = <K extends keyof EditableCreatorFields>(key: K, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
    if (key === "socialLink") setSocialLinkError(null)
  }

  const rows: [keyof EditableCreatorFields, string, boolean?][] = [
    ["bio", "Bio", true],
    ["location", "Location"],
    ["socialLink", "Social link"],
  ]

  const handleSave = () => {
    const normalized = normalizeSocialLink(fields.socialLink)
    if (normalized === null) {
      setSocialLinkError("Enter a valid http(s) URL")
      socialLinkRef.current?.focus()
      return
    }

    onSave({ ...fields, socialLink: normalized })
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {rows.map(([key, label, multiline]) => (
          <View key={key}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              ref={key === "socialLink" ? socialLinkRef : undefined}
              value={fields[key]}
              onChangeText={(v) => update(key, v)}
              multiline={multiline}
              keyboardType={key === "socialLink" ? "url" : "default"}
              autoCapitalize="none"
              style={styles.input}
            />
            {key === "socialLink" && socialLinkError ? (
              <Text style={styles.error}>{socialLinkError}</Text>
            ) : null}
          </View>
        ))}
        <Button title="Save" onPress={handleSave} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 20 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginTop: 4 },
  error: { color: "red", marginTop: 8 },
})
