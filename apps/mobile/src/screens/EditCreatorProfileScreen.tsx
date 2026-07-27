import { useState } from "react"
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"

export interface EditableCreatorFields {
  bio: string
  location: string
  socialLink: string
}

interface Props {
  initial: EditableCreatorFields
  onSave: (fields: EditableCreatorFields) => void
}

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

  return (
    <ScrollView style={styles.container}>
      {rows.map(([key, label, multiline]) => (
        <View key={key}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            value={fields[key]}
            onChangeText={(v) => update(key, v)}
            multiline={multiline}
            style={styles.input}
          />
        </View>
      ))}
      <Button title="Save" onPress={() => onSave(fields)} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginTop: 4 },
})
