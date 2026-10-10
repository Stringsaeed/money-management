import { StyleSheet, View, type ColorValue } from "react-native";

import { KIND_ICON, type SystemKind } from "../category/kinds";
import { useUserColor } from "../category/use-user-color";
import { Icon } from "../icon";
import { Text } from "../text";
import { categoryColors, colors, radius, type CategoryKey } from "../tokens";
import { isCategoryIconName } from "./utils";

export type CategoryTileSize = "md" | "sm";

interface CategoryTileBaseProps {
  /**
   * Tinted variant: the category's tint behind its color. Omit for the default neutral tile —
   * lists stay neutral, tinted tiles are for category screens and legends.
   */
  tint?: CategoryKey;
  /**
   * A user category's own hex. Tints the (round) tile at 18% on paper / 25% on dark; the
   * emoji or icon keeps its own color. Ignored when `kind` is set.
   */
  color?: string;
  /** md is 40pt (rows), sm is 32pt. */
  size?: CategoryTileSize;
}

export type CategoryTileProps = CategoryTileBaseProps &
  (
    | {
        /** A Trove category icon name ("groceries"), or an emoji string for user-made categories. */
        icon: string;
        /** A system kind draws its stroke icon instead of `icon`. */
        kind?: undefined;
      }
    | {
        icon?: string;
        /** System kind: income, expense or transfer — a stroke icon, never an emoji. */
        kind: SystemKind;
      }
  );

const ICON_SIZE = { md: 20, sm: 16 } as const satisfies Record<CategoryTileSize, number>;

interface KindStyle {
  background: ColorValue;
  glyph: ColorValue;
}

const KIND_STYLE = {
  income: { background: colors.positive.subtle, glyph: colors.positive.text },
  expense: { background: colors.fill.neutral, glyph: colors.text.primary },
  transfer: { background: colors.fill.neutral, glyph: colors.text.secondary },
} as const satisfies Record<SystemKind, KindStyle>;

interface TileAppearance {
  background: ColorValue;
  round: boolean;
  glyph: ColorValue | undefined;
}

/** Precedence: system kind, then the user's own colour, then a category tint, then neutral. */
function tileAppearance(
  kind: SystemKind | undefined,
  userTint: string | undefined,
  tint: CategoryKey | undefined,
): TileAppearance {
  if (kind) {
    const { background, glyph } = KIND_STYLE[kind];
    return { background, round: true, glyph };
  }
  if (userTint) return { background: userTint, round: true, glyph: undefined };
  const palette = tint ? categoryColors[tint] : null;
  return {
    background: palette?.tint ?? colors.fill.neutral,
    round: false,
    glyph: palette?.color,
  };
}

/** Decorative tile; the row or button that holds it carries the accessible label. */
export function CategoryTile({ icon, kind, tint, color, size = "md" }: CategoryTileProps) {
  const userColor = useUserColor(kind ? undefined : color);
  const { background, round, glyph } = tileAppearance(kind, userColor?.tint, tint);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.tile,
        tileSize[size],
        round ? styles.round : null,
        { backgroundColor: background },
      ]}
    >
      {kind ? (
        <Icon color={glyph} name={KIND_ICON[kind]} size={ICON_SIZE[size]} />
      ) : (
        <TileGlyph icon={icon} iconColor={glyph} size={size} />
      )}
    </View>
  );
}

function TileGlyph({
  icon,
  iconColor,
  size,
}: {
  icon: string;
  iconColor: ColorValue | undefined;
  size: CategoryTileSize;
}) {
  if (isCategoryIconName(icon)) {
    return <Icon color={iconColor ?? colors.text.primary} name={icon} size={ICON_SIZE[size]} />;
  }
  return (
    <Text allowFontScaling={false} style={emojiSize[size]}>
      {icon}
    </Text>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.sm,
    justifyContent: "center",
  },
  round: { borderRadius: radius.full },
});

const tileSize = StyleSheet.create({
  md: { height: 40, width: 40 },
  sm: { height: 32, width: 32 },
});

const emojiSize = StyleSheet.create({
  md: { fontSize: 20, lineHeight: 24 },
  sm: { fontSize: 16, lineHeight: 20 },
});
