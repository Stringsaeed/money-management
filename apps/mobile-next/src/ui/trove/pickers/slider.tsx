import { StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";

import { Icon } from "../icon";
import { colors, radius, space } from "../tokens";
import { SliderSpeakerIcon } from "./slider-speaker-icon";
import { SliderHeader } from "./slider-header";
import { TOUCH_HEIGHT } from "./slider-metrics";
import { SliderTrack } from "./slider-track";
import { adjustedValue, percentLabel, sliderFraction } from "./slider-utils";
import { useSliderGesture } from "./use-slider-gesture";

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  /** Read out by screen readers, e.g. "Sound effects volume". */
  accessibilityLabel: string;
  minimumValue?: number;
  maximumValue?: number;
  /** Snap interval from `minimumValue`; 0 (default) is continuous. */
  step?: number;
  disabled?: boolean;
  /** Caption at the top left, e.g. "Sound effects". */
  label?: string;
  /** Text for the value at the top right and for screen readers. Defaults to a percentage. */
  formatValue?: (value: number) => string;
  /** Speaker icons at either end, for a volume control. */
  adornment?: "volume";
  testID?: string;
}

/**
 * Settings slider on a card: 6pt track, accent fill, white thumb, value label.
 * It is custom rather than the native slider: native sliders fix their own track thickness and
 * thumb and cannot draw the board's look. Accessible as an adjustable element, so VoiceOver and
 * TalkBack swipe up / down to change it.
 */
export function Slider({
  value,
  onValueChange,
  accessibilityLabel,
  minimumValue = 0,
  maximumValue = 1,
  step = 0,
  disabled = false,
  label,
  formatValue,
  adornment,
  testID,
}: SliderProps) {
  const { gesture, onLayout } = useSliderGesture({
    value,
    minimumValue,
    maximumValue,
    step,
    disabled,
    onValueChange,
  });
  const valueText = (formatValue ?? ((v: number) => percentLabel(v, minimumValue, maximumValue)))(
    value,
  );
  const percent =
    `${Math.round(sliderFraction(value, minimumValue, maximumValue) * 1000) / 10}%` as const;
  const iconColor = disabled ? colors.text.disabled : colors.text.secondary;

  return (
    <View style={styles.card}>
      <SliderHeader disabled={disabled} label={label} valueText={valueText} />
      <View style={styles.row}>
        {adornment ? <SliderSpeakerIcon color={iconColor} /> : null}
        <GestureDetector gesture={gesture}>
          <View
            accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="adjustable"
            accessibilityState={{ disabled }}
            accessibilityValue={{
              min: minimumValue,
              max: maximumValue,
              now: value,
              text: valueText,
            }}
            accessible
            onAccessibilityAction={(event) => {
              if (disabled) return;
              const direction = event.nativeEvent.actionName === "increment" ? 1 : -1;
              onValueChange(adjustedValue(value, direction, minimumValue, maximumValue, step));
            }}
            onLayout={onLayout}
            style={styles.touch}
            testID={testID}
          >
            <SliderTrack disabled={disabled} percent={percent} />
          </View>
        </GestureDetector>
        {adornment ? <Icon color={iconColor} name="volume" size={20} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space[2] + 2,
    paddingHorizontal: space[4],
    paddingVertical: space[3] + 2,
  },
  row: { alignItems: "center", flexDirection: "row", gap: space[3] },
  touch: { flex: 1, height: TOUCH_HEIGHT, justifyContent: "center" },
});
