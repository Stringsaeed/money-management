import type { ColorValue } from "react-native";
import { StyleSheet, View } from "react-native";

import { colors, layout } from "../tokens";
import { USER_COLOR_SWATCHES } from "./palette";
import { Swatch } from "./swatch";
import { isSameColor } from "./utils";

export interface SwatchPickerProps {
  /** The chosen colour as a hex (any case); null or unknown shows no selection. */
  value?: string | null;
  onChange: (hex: string) => void;
  /** Colour of the gap between a selected swatch and its ring. Defaults to the canvas. */
  gapColor?: ColorValue;
  /** Spoken name of the group. */
  accessibilityLabel?: string;
}

/**
 * Nine round colour swatches in one row. Each sits in a 44pt-high target and is read aloud
 * by name ("Orange, selected"). The columns share the row, so on a narrow phone each target
 * narrows toward a ninth of the width rather than wrapping.
 */
export function SwatchPicker({
  value,
  onChange,
  gapColor = colors.bg.canvas,
  accessibilityLabel = "Colour",
}: SwatchPickerProps) {
  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole="radiogroup" style={styles.row}>
      {USER_COLOR_SWATCHES.map(({ name, hex }) => (
        <View key={hex} style={styles.cell}>
          <Swatch
            gapColor={gapColor}
            hex={hex}
            name={name}
            onPress={() => onChange(hex)}
            selected={isSameColor(value, hex)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  cell: { flex: 1, maxWidth: layout.minTouchTarget, minWidth: 0 },
});
