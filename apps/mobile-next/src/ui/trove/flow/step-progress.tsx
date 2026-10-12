import { StyleSheet, View } from "react-native";

import { colors, radius, space } from "../tokens";
import { stepSegments } from "./utils";

interface StepProgressProps {
  step: number;
  of: number;
  accessibilityLabel: string;
}

/** Equal 4pt segments, done in accent.fill, to come in the track tone. */
export function StepProgress({ step, of, accessibilityLabel }: StepProgressProps) {
  const segments = stepSegments(step, of);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: segments.length, now: Math.min(step, segments.length) }}
      accessible
      style={styles.track}
    >
      {segments.map((done, index) => (
        <View key={index} style={done ? styles.done : styles.todo} />
      ))}
    </View>
  );
}

const segment = { borderRadius: radius.full, flex: 1, height: 4 } as const;

const styles = StyleSheet.create({
  track: { flex: 1, flexDirection: "row", gap: space[1] },
  done: { ...segment, backgroundColor: colors.accent.fill },
  todo: { ...segment, backgroundColor: colors.budget.stepTrack },
});
