import { Pressable, StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "../../motion";
import { colors, motion, radius, space, troveTransition } from "../tokens";

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Switches carry no visible label of their own; name the setting. */
  accessibilityLabel: string;
  disabled?: boolean;
  testID?: string;
}

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const TRACK_PADDING = 3;
const THUMB = TRACK_HEIGHT - TRACK_PADDING * 2;
const TRAVEL = TRACK_WIDTH - TRACK_PADDING * 2 - THUMB;
/** Lifts the 28pt track to the 44pt touch target. */
const HIT_SLOP = { top: 8, bottom: 8, left: 4, right: 4 } as const;

/** 48×28 pill switch: accent track when on, strong border tone when off, white thumb. */
export function Switch({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
  testID,
}: SwitchProps) {
  const reducedMotion = useReducedMotion();
  const track = disabled ? styles.trackDisabled : value ? styles.trackOn : styles.trackOff;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      onPress={() => onValueChange(!value)}
      testID={testID}
    >
      <View style={[styles.track, track]}>
        <EaseView
          animate={{ translateX: value ? TRAVEL : 0 }}
          style={[styles.thumb, disabled ? styles.thumbDisabled : styles.thumbEnabled]}
          transition={troveTransition(reducedMotion, motion.base)}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: radius.full,
    height: TRACK_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: TRACK_PADDING,
    width: TRACK_WIDTH,
  },
  trackOn: { backgroundColor: colors.accent.fill },
  trackOff: { backgroundColor: colors.border.strong },
  trackDisabled: { backgroundColor: colors.fill.disabled },
  thumb: { borderRadius: radius.full, height: THUMB, width: THUMB },
  thumbEnabled: {
    backgroundColor: colors.surface.paper,
    boxShadow: [
      { offsetX: 0, offsetY: 1, blurRadius: space[0.5], color: colors.elevation.shadow2 },
    ],
  },
  thumbDisabled: { backgroundColor: colors.text.disabled },
});
