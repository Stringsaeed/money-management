import { StyleSheet, View } from "react-native";

import { Icon } from "../icon";
import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, radius, space } from "../tokens";

export type BreadcrumbSegmentState = "set" | "active" | "unset";

export interface BreadcrumbSegmentSpec {
  key: string;
  /** Decorative leading emoji. */
  emoji: string;
  /** The value, or for an unset segment what it wants ("Category"). */
  label: string;
  state: BreadcrumbSegmentState;
  onPress?: () => void;
  /** Defaults to `label`. */
  accessibilityLabel?: string;
}

interface BreadcrumbSegmentProps {
  segment: BreadcrumbSegmentSpec;
  /** "path" segments open a picker (expanded); "toggle" segments are a selected/unselected row. */
  mode: "path" | "toggle";
  /** Chevron after this segment. */
  separator: boolean;
}

const LABEL_TONE = {
  set: "primary",
  active: "primary",
  unset: "tertiary",
} as const;

/** One breadcrumb button plus its trailing chevron. */
export function BreadcrumbSegment({ segment, mode, separator }: BreadcrumbSegmentProps) {
  const { state } = segment;
  const active = state === "active";
  return (
    <View style={styles.item}>
      <PressableScale
        accessibilityHint={state === "unset" ? "Not set yet" : undefined}
        accessibilityLabel={segment.accessibilityLabel ?? segment.label}
        accessibilityRole={mode === "toggle" ? "togglebutton" : "button"}
        accessibilityState={mode === "toggle" ? { selected: active } : { expanded: active }}
        onPress={segment.onPress}
        scaleOnPress={false}
        style={[styles.segment, segmentStyles[state]]}
      >
        <Text accessibilityElementsHidden style={styles.emoji} variant="bodyLg">
          {segment.emoji}
        </Text>
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          tone={LABEL_TONE[state]}
          variant="labelMd"
        >
          {segment.label}
        </Text>
      </PressableScale>
      {separator ? <Icon color={colors.text.tertiary} name="chevron-right" size={16} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  segment: {
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 2,
    flexDirection: "row",
    gap: 6,
    height: 36,
    paddingHorizontal: space[3] - 2,
  },
  emoji: {
    fontSize: 16,
    lineHeight: 20,
  },
});

const segmentStyles = StyleSheet.create({
  set: { backgroundColor: colors.fill.selected, borderColor: "transparent" },
  active: { backgroundColor: colors.fill.selected, borderColor: colors.accent.text },
  unset: {
    backgroundColor: "transparent",
    borderColor: colors.border.default,
    borderStyle: "dashed",
    borderWidth: 1.5,
  },
});
