import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "../../motion";
import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, motion, radius, troveTransition } from "../tokens";
import { segmentLayout, TRACK_GAP, TRACK_PADDING } from "./utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/** 36pt pill track with equal segments; the selected thumb slides on `fill.selected`. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const reducedMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const thumb = segmentLayout(trackWidth, options.length, selectedIndex);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
      style={styles.track}
    >
      {thumb.width > 0 ? (
        <EaseView
          animate={{ translateX: thumb.x }}
          initialAnimate={{ translateX: thumb.x }}
          pointerEvents="none"
          style={[styles.thumb, { width: thumb.width }]}
          transition={troveTransition(reducedMotion, motion.base)}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <View key={option.value} style={styles.slot}>
            <PressableScale
              accessibilityLabel={option.label}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, selected }}
              hitSlop={{ top: 4, bottom: 4 }}
              onPress={() => onChange(option.value)}
              scaleOnPress={false}
              style={styles.segment}
            >
              <Text tone={selected ? "primary" : "secondary"} variant="labelSm">
                {option.label}
              </Text>
            </PressableScale>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.fill.neutral,
    borderCurve: "continuous",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: TRACK_GAP,
    height: 36,
    padding: TRACK_PADDING,
  },
  thumb: {
    backgroundColor: colors.fill.selected,
    borderCurve: "continuous",
    borderRadius: radius.full,
    // Light mode lifts the thumb with a hairline shadow; the dark token is transparent.
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 2, color: colors.elevation.shadow2 }],
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
    position: "absolute",
    top: TRACK_PADDING,
  },
  // PressableScale styles its inner body only, so the flex slot lives on this wrapper.
  slot: { flex: 1, justifyContent: "center" },
  segment: { alignItems: "center", height: 32, justifyContent: "center" },
});
