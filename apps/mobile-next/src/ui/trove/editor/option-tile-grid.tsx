import { Children, isValidElement, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { space } from "../tokens";

export interface OptionTileGridProps {
  /** `OptionTile`s with `layout="grid"`. */
  children: ReactNode;
  /** Tiles per row. Defaults to 3. */
  columns?: number;
  accessibilityLabel?: string;
}

/** Equal-width rows of grid option tiles. A short last row keeps the same tile width. */
export function OptionTileGrid({ children, columns = 3, accessibilityLabel }: OptionTileGridProps) {
  const tiles = Children.toArray(children);
  const rows = Array.from({ length: Math.ceil(tiles.length / columns) }, (_, row) =>
    tiles.slice(row * columns, (row + 1) * columns),
  );
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      style={styles.grid}
    >
      {rows.map((row) => (
        <View key={rowKey(row)} style={styles.row}>
          {row}
          {Array.from({ length: columns - row.length }, (_, pad) => (
            <View key={`pad-${pad}`} style={styles.pad} />
          ))}
        </View>
      ))}
    </View>
  );
}

const rowKey = (row: readonly ReactNode[]) =>
  row.map((tile) => (isValidElement(tile) ? tile.key : "")).join("|");

const styles = StyleSheet.create({
  grid: { gap: space[2] },
  row: { flexDirection: "row", gap: space[2] },
  pad: { flex: 1 },
});
