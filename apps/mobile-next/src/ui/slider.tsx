import { Slider as NativeSlider } from "@expo/ui/community/slider";
import { StyleSheet, useColorScheme } from "react-native";

import { rawColorValues } from "./design-tokens";

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  disabled?: boolean;
}

export function Slider({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 1,
  step = 0,
  disabled = false,
}: SliderProps) {
  // Native slider tints reject opaque PlatformColor maps; bridge the canonical palette.
  const palette = useColorScheme() === "dark" ? rawColorValues.dark : rawColorValues.light;
  return (
    <NativeSlider
      value={value}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      step={step}
      disabled={disabled}
      minimumTrackTintColor={palette.primary}
      maximumTrackTintColor={palette.border}
      thumbTintColor={palette.primary}
      onValueChange={onValueChange}
      style={styles.slider}
    />
  );
}

const styles = StyleSheet.create({ slider: { width: "100%" } });
