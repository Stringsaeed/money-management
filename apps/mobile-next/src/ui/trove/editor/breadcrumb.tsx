import { StyleSheet, View } from "react-native";

import { colors, radius } from "../tokens";
import { BreadcrumbSegment, type BreadcrumbSegmentSpec } from "./breadcrumb-segment";

export interface BreadcrumbProps {
  segments: readonly BreadcrumbSegmentSpec[];
  /**
   * "path" (default) reads left to right as one sentence with chevrons between segments; the
   * open segment is `expanded`. "toggle" drops the chevrons and exposes each segment as a
   * toggle button whose active state is `selected`.
   */
  variant?: "path" | "toggle";
  accessibilityLabel?: string;
}

/**
 * Pill bar of tappable segments on fill.neutral with a ring. A segment is set, active (accent.text
 * ring) or unset (dashed ring, naming what it wants).
 */
export function Breadcrumb({
  segments,
  variant = "path",
  accessibilityLabel = "Entry details",
}: BreadcrumbProps) {
  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole="toolbar" style={styles.track}>
      {segments.map((segment, index) => (
        <BreadcrumbSegment
          key={segment.key}
          mode={variant}
          segment={segment}
          separator={variant === "path" && index < segments.length - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.fill.neutral,
    borderColor: colors.border.default,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: 2,
    maxWidth: "100%",
    padding: 3,
  },
});
