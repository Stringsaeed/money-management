import { Pressable, View } from "react-native";

import { keyPressHaptic } from "./keypad-haptic";
import { KeyFace } from "./keypad-key-face";
import { KeypadHoldKey } from "./keypad-hold-key";
import { keypadKeyLabel, type KeypadKey } from "./keypad-input";
import { keyStyles } from "./keypad-key-styles";

export interface KeypadKeyButtonProps {
  keyName: KeypadKey;
  /** Character drawn on the decimal key. */
  decimalSeparator: string;
  onPress: (key: KeypadKey) => void;
  /** Key grows to the row height (min 48) and wears the surface fill and ring. */
  fill?: boolean;
  /**
   * Backspace only: holding it for 600 ms calls this instead of deleting one digit. Omit to keep
   * the delete key a plain tap.
   */
  onClear?: () => void;
  /** Backspace only: false when there is nothing to clear, so holding does nothing special. */
  canClear?: boolean;
}

/** One round key: 64pt, or row-height in `fill` mode. Pressed fills with fill.neutral and taps a light haptic. */
export function KeypadKeyButton({
  keyName,
  decimalSeparator,
  onPress,
  fill = false,
  onClear,
  canClear = true,
}: KeypadKeyButtonProps) {
  if (keyName === "backspace" && onClear) {
    return (
      <KeypadHoldKey
        canClear={canClear}
        decimalSeparator={decimalSeparator}
        fill={fill}
        onClear={onClear}
        onPress={onPress}
      />
    );
  }
  return (
    <View style={keyStyles.cell}>
      <Pressable
        accessibilityLabel={keypadKeyLabel(keyName)}
        accessibilityRole="button"
        onPress={() => {
          keyPressHaptic();
          onPress(keyName);
        }}
        pressRetentionOffset={12}
        style={({ pressed }) => [
          keyStyles.key,
          fill ? keyStyles.keyFill : null,
          pressed ? keyStyles.pressed : null,
        ]}
      >
        <KeyFace decimalSeparator={decimalSeparator} keyName={keyName} />
      </Pressable>
    </View>
  );
}
