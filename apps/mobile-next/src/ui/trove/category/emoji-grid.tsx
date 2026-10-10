import { StyleSheet, View } from "react-native";

import { space } from "../tokens";
import { EmojiCell } from "./emoji-cell";
import { useUserColor } from "./use-user-color";
import { chunkRows } from "./utils";

export interface EmojiOption {
  glyph: string;
  /** Spoken name, e.g. "Coffee". */
  name: string;
}

export interface EmojiGridProps {
  options: readonly EmojiOption[];
  /** The chosen emoji glyph. */
  value?: string | null;
  onChange: (glyph: string) => void;
  /** The category's chosen hex: tints and rings the selected cell. */
  color?: string | null;
  /** Spoken name of the group. */
  accessibilityLabel?: string;
}

const COLUMNS = 6;

/** Six-column grid of emoji radio buttons; the selected one wears the chosen colour. */
export function EmojiGrid({
  options,
  value,
  onChange,
  color,
  accessibilityLabel = "Emoji",
}: EmojiGridProps) {
  const userColor = useUserColor(color);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      style={styles.grid}
    >
      {chunkRows(options, COLUMNS).map((row) => (
        <View key={row[0]?.glyph} style={styles.row}>
          {row.map(({ glyph, name }) => (
            <View key={glyph} style={styles.cell}>
              <EmojiCell
                color={userColor}
                glyph={glyph}
                name={name}
                onPress={() => onChange(glyph)}
                selected={glyph === value}
              />
            </View>
          ))}
          {Array.from({ length: COLUMNS - row.length }, (_, index) => (
            <View key={`spacer-${index}`} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: space[2] },
  row: { flexDirection: "row", gap: space[2] },
  cell: { flex: 1, minWidth: 0 },
});
