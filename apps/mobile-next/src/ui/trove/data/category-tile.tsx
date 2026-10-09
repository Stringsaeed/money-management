import { StyleSheet, View } from "react-native";

import { Icon } from "../icon";
import { Text } from "../text";
import { categoryColors, colors, radius, type CategoryKey } from "../tokens";
import { isCategoryIconName } from "./utils";

export type CategoryTileSize = "md" | "sm";

export interface CategoryTileProps {
  /** A Trove category icon name ("groceries"), or an emoji string for user-made categories. */
  icon: string;
  /**
   * Tinted variant: the category's tint behind its color. Omit for the default neutral tile —
   * lists stay neutral, tinted tiles are for category screens and legends.
   */
  tint?: CategoryKey;
  /** md is 40pt (rows), sm is 32pt. */
  size?: CategoryTileSize;
}

const ICON_SIZE = { md: 20, sm: 16 } as const satisfies Record<CategoryTileSize, number>;

/** Decorative tile; the row or button that holds it carries the accessible label. */
export function CategoryTile({ icon, tint, size = "md" }: CategoryTileProps) {
  const palette = tint ? categoryColors[tint] : null;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.tile,
        tileSize[size],
        { backgroundColor: palette?.tint ?? colors.fill.neutral },
      ]}
    >
      {isCategoryIconName(icon) ? (
        <Icon color={palette?.color ?? colors.text.primary} name={icon} size={ICON_SIZE[size]} />
      ) : (
        <Text allowFontScaling={false} style={emojiSize[size]}>
          {icon}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.sm,
    justifyContent: "center",
  },
});

const tileSize = StyleSheet.create({
  md: { height: 40, width: 40 },
  sm: { height: 32, width: 32 },
});

const emojiSize = StyleSheet.create({
  md: { fontSize: 20, lineHeight: 24 },
  sm: { fontSize: 16, lineHeight: 20 },
});
