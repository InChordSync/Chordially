const DEFAULT_STEPS: Step[] = [
  { label: "Connect Stellar Wallet", done: false },
  { label: "Fill Creator Bio & Profile Details", done: false },
  { label: "Upload Avatar & Banner", done: false },
  { label: "Create First Campaign", done: false },
]

import { StyleSheet, Text, View } from "react-native"

interface Step {
  label: string
  done: boolean
}

interface Props {
  steps: Step[]
}

/**
 * Mirrors the web onboarding checklist so mobile creators see the same
 * setup steps and progress, in the same order, as the web flow.
 */
export default function CreatorSetupProgressScreen({ steps = DEFAULT_STEPS }: Props) {
  const completed = steps.filter((s) => s.done).length

  return (
    <View style={styles.container} testID="setup-progress">
      <Text style={styles.heading}>
        {completed} of {steps.length} steps complete
      </Text>
      {steps.map((step) => (
        <View key={step.label} style={styles.row}>
          <Text style={styles.bullet}>{step.done ? "✓" : "○"}</Text>
          <Text style={step.done ? styles.done : styles.pending}>
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  bullet: { width: 20 },
  done: { color: "#2a9d3f" },
  pending: { color: "#666" },
})
