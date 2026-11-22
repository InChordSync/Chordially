import { StyleSheet, Text, View } from "react-native"
import {
  DEFAULT_CREATOR_SETUP_STEPS,
  type CreatorSetupStep,
} from "../constants/creator-setup"

interface Props {
  steps?: CreatorSetupStep[]
}

/**
 * Mirrors the web onboarding checklist so mobile creators see the same
 * setup steps and progress, in the same order, as the web flow.
 */
export default function CreatorSetupProgressScreen({ steps = DEFAULT_CREATOR_SETUP_STEPS }: Props) {
  const completed = steps.filter((s) => s.done).length
  const progress = steps.length > 0 ? completed / steps.length : 0

  return (
    <View style={styles.container} testID="setup-progress">
      <Text style={styles.heading}>
        {completed} of {steps.length} steps complete
      </Text>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Creator setup progress"
        accessibilityValue={{ min: 0, max: steps.length, now: completed }}
        style={styles.progressTrack}
        testID="setup-progress-bar"
      >
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      {steps.map((step) => (
        <View key={step.label} style={styles.row}>
          <Text
            style={styles.stateText}
            accessibilityLabel={step.done ? "Completed" : "Not completed"}
          >
            {step.done ? "[done]" : "[todo]"}
          </Text>
          <Text style={step.done ? styles.done : styles.pending}>{step.label}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  progressTrack: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: { height: "100%", backgroundColor: "#2a9d3f" },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  stateText: { width: 56, color: "#374151", fontSize: 12 },
  done: { color: "#2a9d3f" },
  pending: { color: "#666" },
})
