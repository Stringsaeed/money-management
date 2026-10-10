import { StyleSheet, View } from "react-native";

import { Text } from "../text";

interface SliderHeaderProps {
  label?: string;
  valueText: string;
  disabled: boolean;
}

/** Caption on the left, value on the right. The value is spoken through the slider itself. */
export function SliderHeader({ label, valueText, disabled }: SliderHeaderProps) {
  return (
    <View style={styles.header}>
      {label ? (
        <Text tone={disabled ? "disabled" : "primary"} variant="labelMd">
          {label}
        </Text>
      ) : null}
      <View style={styles.spacer} />
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        tone={disabled ? "disabled" : "secondary"}
        variant="amountSm"
      >
        {valueText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "baseline", flexDirection: "row" },
  spacer: { flex: 1 },
});
