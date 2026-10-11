import { StyleSheet, View } from "react-native";

import { colors, radius, space } from "../tokens";

export interface ProgressBarProps {
  /** How full the bar is, 0 to 1. Out-of-range and non-finite values are clamped. */
  fraction: number;
  /** `accent` for progress; `negative` for a bar that has gone over. */
  tone?: "accent" | "negative";
  /**
   * Spoken as a progress bar with this label and its percentage. Leave it out when the parent
   * row already says it, and the bar stays out of the way of assistive tech.
   */
  accessibilityLabel?: string;
  testID?: string;
}

const clampFraction = (fraction: number) =>
  Number.isFinite(fraction) ? Math.min(Math.max(fraction, 0), 1) : 0;

/** 8pt pill track (fill.neutral) with a rounded fill: accent, or negative when over. */
export function ProgressBar({
  fraction,
  tone = "accent",
  accessibilityLabel,
  testID,
}: ProgressBarProps) {
  const clamped = clampFraction(fraction);
  const labelled = accessibilityLabel !== undefined;

  return (
    <View
      accessibilityElementsHidden={!labelled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={labelled ? "progressbar" : undefined}
      accessibilityValue={
        labelled ? { min: 0, max: 100, now: Math.round(clamped * 100) } : undefined
      }
      accessible={labelled}
      importantForAccessibility={labelled ? "yes" : "no-hide-descendants"}
      style={styles.track}
      testID={testID}
    >
      {/* The fill's width is data, so it is the one inline style. */}
      <View
        style={[
          styles.fill,
          tone === "negative" ? styles.negative : styles.accent,
          { width: `${Math.round(clamped * 100)}%` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.fill.neutral,
    borderRadius: radius.full,
    height: space[2],
    overflow: "hidden",
  },
  fill: { borderRadius: radius.full, height: "100%" },
  accent: { backgroundColor: colors.accent.fill },
  negative: { backgroundColor: colors.negative.text },
});
