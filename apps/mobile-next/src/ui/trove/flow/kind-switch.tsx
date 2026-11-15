import { useState } from "react";
import { StyleSheet, Text as NativeText, View, type LayoutChangeEvent } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "../../motion";
import { PressableScale } from "../pressable-scale";
import { colors, DENSE_MAX_FONT_SCALE, fonts, motion, radius, troveTransition } from "../tokens";
import { KIND_TRACK_GAP, KIND_TRACK_INSET, KIND_TRACK_RING, kindThumbLayout } from "./utils";

export interface KindOption<T extends string> {
  value: T;
  label: string;
  /** Leading emoji, e.g. 💸 Spent · ↩️ Money back · 💰 Got paid. */
  emoji?: string;
}

export interface KindSwitchProps<T extends string> {
  options: readonly KindOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the tab list, e.g. "Kind". */
  accessibilityLabel?: string;
}

const TAB_HEIGHT = 34;

/**
 * Entry-kind tabs (Quick add): a ringed neutral track with equal emoji tabs; the selected
 * thumb slides on `segmentOn`. Not `SegmentedControl`: the board's track is taller, ringed,
 * 4pt inset, with a flat thumb and 14pt emoji labels.
 */
export function KindSwitch<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: KindSwitchProps<T>) {
  const reducedMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const thumb = kindThumbLayout(trackWidth, options.length, selectedIndex);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tablist"
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
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              hitSlop={{ top: 4, bottom: 4 }}
              onPress={() => onChange(option.value)}
              scaleOnPress={false}
              style={styles.tab}
            >
              {option.emoji ? (
                <NativeText
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
                  style={styles.label}
                >
                  {option.emoji}
                </NativeText>
              ) : null}
              <NativeText
                maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
                numberOfLines={1}
                style={[styles.label, selected ? styles.on : styles.off]}
              >
                {option.label}
              </NativeText>
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
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: KIND_TRACK_RING,
    flexDirection: "row",
    gap: KIND_TRACK_GAP,
    padding: KIND_TRACK_INSET - KIND_TRACK_RING,
  },
  // Absolute children sit inside the ring, so the thumb starts at the padding edge.
  thumb: {
    backgroundColor: colors.segmentOn,
    borderCurve: "continuous",
    borderRadius: radius.full,
    height: TAB_HEIGHT,
    left: KIND_TRACK_INSET - KIND_TRACK_RING,
    position: "absolute",
    top: KIND_TRACK_INSET - KIND_TRACK_RING,
  },
  slot: { flex: 1 },
  tab: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    height: TAB_HEIGHT,
    justifyContent: "center",
  },
  label: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 19 },
  on: { color: colors.text.primary },
  off: { color: colors.text.secondary },
});
