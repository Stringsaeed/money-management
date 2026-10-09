import { StyleSheet, View } from "react-native";

import { Icon } from "../icon";
import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, radius } from "../tokens";
import { keyPressHaptic } from "./keypad-haptic";
import { keypadKeyLabel, type KeypadKey } from "./keypad-input";

export interface KeypadKeyButtonProps {
  keyName: KeypadKey;
  /** Character drawn on the decimal key. */
  decimalSeparator: string;
  onPress: (key: KeypadKey) => void;
}

const KEY_HEIGHT = 64;

/** One 64pt round key. Pressed fills with fill.neutral and taps a light haptic. */
export function KeypadKeyButton({ keyName, decimalSeparator, onPress }: KeypadKeyButtonProps) {
  return (
    <View style={styles.cell}>
      <PressableScale
        accessibilityLabel={keypadKeyLabel(keyName)}
        accessibilityRole="button"
        onPress={() => {
          keyPressHaptic();
          onPress(keyName);
        }}
        pressedStyle={styles.pressed}
        scaleOnPress={false}
        style={styles.key}
      >
        <KeyFace decimalSeparator={decimalSeparator} keyName={keyName} />
      </PressableScale>
    </View>
  );
}

function KeyFace({ keyName, decimalSeparator }: Omit<KeypadKeyButtonProps, "onPress">) {
  if (keyName === "backspace") return <Icon name="backspace" size={26} />;
  return (
    <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.label} variant="amountLg">
      {keyName === "decimal" ? decimalSeparator : keyName}
    </Text>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
  },
  key: {
    alignItems: "center",
    borderRadius: radius.full,
    height: KEY_HEIGHT,
    justifyContent: "center",
  },
  pressed: {
    backgroundColor: colors.fill.neutral,
  },
  label: {
    fontSize: 26,
    lineHeight: 32,
  },
});
