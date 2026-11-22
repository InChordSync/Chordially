import { useMemo, useState } from "react"
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"

export interface EditableCreatorFields {
  bio: string
  location: string
  socialLink: string
}

interface Props {
  initial: EditableCreatorFields
  onSave: (fields: EditableCreatorFields) => void
}

const BIO_MAX_LENGTH = 300

/** Minimal mobile form for editing bio, location, and one social link. */
export default function EditCreatorProfileScreen({ initial, onSave }: Props) {
  const [fields, setFields] = useState(initial)

  const update = <K extends keyof EditableCreatorFields>(key: K, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }))

  const rows: [keyof EditableCreatorFields, string, boolean?][] = [
    ["bio", "Bio", true],
    ["location", "Location"],
    ["socialLink", "Social link"],
  ]

  const isDirty = useMemo(
    () =>
      fields.bio !== initial.bio ||
      fields.location !== initial.location ||
      fields.socialLink !== initial.socialLink,
    [fields, initial],
  )

  const socialLinkInvalid = fields.socialLink.trim() !== "" && !fields.socialLink.startsWith("http")
  const canSave = isDirty && !socialLinkInvalid

  const handleDiscard = () => {
    if (!isDirty) return
    Alert.alert("Discard changes?", "Your unsaved profile changes will be lost.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => setFields(initial) },
    ])
  }

  return (
    <ScrollView style={styles.container}>
      {rows.map(([key, label, multiline]) => (
        <View key={key} accessible={false}>
          <Text style={styles.label} nativeID={`${key}-label`}>{label}</Text>
          <TextInput
            value={fields[key]}
            onChangeText={(v) => update(key, v)}
            multiline={multiline}
            keyboardType={key === "socialLink" ? "url" : "default"}
            autoCapitalize="none"
            style={styles.input}
            accessibilityLabel={label}
            accessibilityLabelledBy={`${key}-label`}
            testID={`edit-profile-${key}`}
            maxLength={key === "bio" ? BIO_MAX_LENGTH : undefined}
          />
          {key === "bio" && (
            <Text style={styles.counter} testID="bio-counter">
              {fields.bio.length}/{BIO_MAX_LENGTH}
            </Text>
          )}
        </View>
      ))}
      {socialLinkInvalid && (
        <Text style={styles.error} accessibilityRole="alert">Invalid social link URL</Text>
      )}
      {isDirty && <Text style={styles.warning} testID="unsaved-warning">You have unsaved changes.</Text>}
      <View style={styles.actions}>
        <Button
          title="Save"
          onPress={() => {
            if (!canSave) return
            onSave(fields)
          }}
          disabled={!canSave}
          testID="save-profile"
        />
        <View style={styles.discardButton}>
          <Button title="Discard changes" onPress={handleDiscard} disabled={!isDirty} testID="discard-profile" />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginTop: 4 },
  counter: { fontSize: 12, color: "#666", marginTop: 4, textAlign: "right" },
  error: { color: "red", marginTop: 8 },
  warning: { color: "#92400e", marginTop: 8 },
  actions: { marginTop: 16, gap: 8 },
  discardButton: { marginTop: 8 },
})
