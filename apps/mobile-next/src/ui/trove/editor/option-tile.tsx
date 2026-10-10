import { StyleSheet, View } from "react-native";

import { PressableScale } from "../pressable-scale";
import { colors, radius, space } from "../tokens";
import { OptionTileGridBody } from "./option-tile-grid-body";
import { OptionTileListBody } from "./option-tile-list-body";

export interface OptionTileProps {
  /** Decorative emoji. */
  emoji: string;
  name: string;
  /** List layout only: a mono line under the name, e.g. "AED · 12,480.50". */
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  /** "list" is a full-width row with a trailing check; "grid" stacks emoji over label. */
  layout?: "list" | "grid";
}

/**
 * Emoji option tile for a single-choice picker. Selected tiles fill with accent.fill and use
 * accent.on; others sit on the surface with a thin ring. Exposed as a radio, so wrap a set in an
 * element with `accessibilityRole="radiogroup"`.
 */
export function OptionTile({
  emoji,
  name,
  subtitle,
  selected,
  onPress,
  layout = "list",
}: OptionTileProps) {
  const grid = layout === "grid";
  return (
    <View style={grid ? styles.gridCell : undefined}>
      <PressableScale
        accessibilityLabel={subtitle && !grid ? `${name}, ${subtitle}` : name}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        onPress={onPress}
        pressedStyle={selected ? styles.pressedSelected : styles.pressed}
        style={[grid ? styles.grid : styles.list, selected ? styles.selected : styles.idle]}
      >
        {grid ? (
          <OptionTileGridBody emoji={emoji} name={name} selected={selected} />
        ) : (
          <OptionTileListBody emoji={emoji} name={name} selected={selected} subtitle={subtitle} />
        )}
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Grid tiles share their row equally; `OptionTileGrid` lays the rows out. */
  gridCell: { flex: 1, minWidth: 0 },
  list: {
    alignItems: "center",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: space[3],
    minHeight: 60,
    paddingHorizontal: space[4],
  },
  grid: {
    alignItems: "center",
    borderRadius: radius.lg,
    gap: space[1],
    paddingBottom: 10,
    paddingHorizontal: 6,
    paddingTop: space[3],
  },
  idle: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.subtle,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: colors.accent.fill,
    borderColor: colors.accent.fill,
    borderWidth: 1,
  },
  pressed: { backgroundColor: colors.fill.neutral },
  pressedSelected: { backgroundColor: colors.accent.pressed },
});
