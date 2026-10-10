import { StyleSheet, View } from "react-native";

import { colors, radius } from "../tokens";
import { THUMB_SIZE, TRACK_HEIGHT } from "./slider-metrics";

interface SliderTrackProps {
  /** Position along the track, as a percentage string such as "60%". */
  percent: `${number}%`;
  disabled: boolean;
}

/** Track, accent fill and thumb. The thumb centre travels a strip inset by half a thumb. */
export function SliderTrack({ percent, disabled }: SliderTrackProps) {
  return (
    <View style={styles.travel}>
      <View style={[styles.track, disabled ? styles.trackDisabled : styles.trackIdle]}>
        <View
          style={[styles.fill, disabled ? styles.fillDisabled : styles.fillOn, { width: percent }]}
        />
      </View>
      <View
        style={[styles.thumb, disabled ? styles.thumbDisabled : styles.thumbOn, { left: percent }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  travel: { height: THUMB_SIZE, justifyContent: "center", marginHorizontal: THUMB_SIZE / 2 },
  track: { borderRadius: radius.full, height: TRACK_HEIGHT, overflow: "hidden" },
  trackIdle: { backgroundColor: colors.fill.neutral },
  trackDisabled: { backgroundColor: colors.fill.disabled },
  fill: { borderRadius: radius.full, height: TRACK_HEIGHT },
  fillOn: { backgroundColor: colors.accent.fill },
  fillDisabled: { backgroundColor: colors.text.disabled },
  thumb: {
    borderRadius: radius.full,
    height: THUMB_SIZE,
    marginLeft: -THUMB_SIZE / 2,
    position: "absolute",
    width: THUMB_SIZE,
  },
  thumbOn: {
    backgroundColor: colors.surface.paper,
    borderColor: colors.elevation.ring1,
    borderWidth: 1,
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 3, color: colors.elevation.shadow3 }],
  },
  thumbDisabled: { backgroundColor: colors.text.disabled },
});
