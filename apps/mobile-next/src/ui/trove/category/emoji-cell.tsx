import { StyleSheet } from "react-native";

import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, radius } from "../tokens";
import type { UserColor } from "./utils";

export interface EmojiCellProps {
  glyph: string;
  name: string;
  selected: boolean;
  /** The chosen user colour; the selected cell takes its tint and ring. */
  color: UserColor | null;
  onPress: () => void;
}

export function EmojiCell({ glyph, name, selected, color, onPress }: EmojiCellProps) {
  return (
    <PressableScale
      accessibilityLabel={name}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.cell,
        selected
          ? {
              backgroundColor: color?.tint ?? colors.fill.neutral,
              borderColor: color?.ring ?? colors.border.strong,
              borderWidth: 2,
            }
          : styles.idle,
      ]}
    >
      <Text allowFontScaling={false} style={styles.glyph}>
        {glyph}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 50,
    justifyContent: "center",
    width: "100%",
  },
  idle: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.subtle,
    borderWidth: 1,
  },
  glyph: { fontSize: 24, lineHeight: 28 },
});
