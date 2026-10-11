import { StyleSheet, View } from "react-native";

import { Icon } from "../icon";
import { colors, radius } from "../tokens";

export interface CheckboxBoxProps {
  checked: boolean;
  disabled?: boolean;
}

const BOX = 22;

/** The 22pt box alone, radius.sm. Checked: accent fill with an on-accent tick. Not pressable. */
export function CheckboxBox({ checked, disabled = false }: CheckboxBoxProps) {
  const box = (disabled ? disabledBox : enabledBox)[checked ? "checked" : "unchecked"];
  const tick = disabled ? colors.text.disabled : colors.accent.on;

  return (
    <View style={[styles.box, box]}>
      {checked ? <Icon color={tick} name="check" size={20} strokeWidth={2.5} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    borderRadius: radius.sm,
    height: BOX,
    justifyContent: "center",
    width: BOX,
  },
});

const enabledBox = StyleSheet.create({
  checked: { backgroundColor: colors.accent.fill },
  unchecked: { borderColor: colors.border.strong, borderWidth: 1.5 },
});

const disabledBox = StyleSheet.create({
  checked: { backgroundColor: colors.fill.disabled },
  unchecked: { borderColor: colors.border.default, borderWidth: 1.5 },
});
