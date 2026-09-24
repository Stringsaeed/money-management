import { Switch as NativeSwitch, useColorScheme } from "react-native";

import { rawColorValues } from "./design-tokens";

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function Switch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: SwitchProps) {
  // Track colors are processed natively; bridge the canonical palette like other native controls.
  const palette = useColorScheme() === "dark" ? rawColorValues.dark : rawColorValues.light;
  return (
    <NativeSwitch
      accessibilityLabel={accessibilityLabel}
      value={value}
      disabled={disabled}
      onValueChange={onValueChange}
      trackColor={{ false: palette.border, true: palette.primary }}
    />
  );
}
