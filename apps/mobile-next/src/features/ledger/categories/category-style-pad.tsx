import { ScrollView, StyleSheet, View } from "react-native";

import type { CategoryInput } from "@/data/ledger-client";
import { colors, spacing } from "@/ui/design-tokens";

import { usePadHeight } from "../editor/use-pad-height";
import { CATEGORY_EMOJIS, categoryColorsFor } from "./category-palette";
import { ColorSwatch } from "./color-swatch";
import { EmojiKey } from "./emoji-key";

interface CategoryStylePadProps {
  readonly kind: CategoryInput["kind"];
  readonly color: string;
  readonly icon: string;
  readonly onColorChange: (color: string) => void;
  readonly onIconChange: (icon: string) => void;
}

/** The category editor's counterpart to the keypad: a color row over an emoji grid. */
export function CategoryStylePad({
  kind,
  color,
  icon,
  onColorChange,
  onIconChange,
}: CategoryStylePadProps) {
  const height = usePadHeight();

  return (
    <View style={[styles.pad, { height }]} testID="category-style-pad">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.swatches}
        style={styles.swatchRow}
      >
        {categoryColorsFor(color).map((swatch) => (
          <ColorSwatch
            key={swatch.hex}
            hex={swatch.hex}
            name={swatch.name}
            selected={swatch.hex.toLowerCase() === color.toLowerCase()}
            onPress={() => onColorChange(swatch.hex)}
          />
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {CATEGORY_EMOJIS[kind].map((emoji) => (
          <EmojiKey
            key={emoji}
            emoji={emoji}
            selected={emoji === icon}
            tint={color}
            onPress={() => onIconChange(emoji)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    borderTopColor: colors.ledgerOutline,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
    paddingBottom: spacing[2],
    paddingTop: spacing[3],
  },
  swatchRow: { flexGrow: 0 },
  swatches: { gap: spacing[1.5], paddingHorizontal: spacing[5] },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: spacing[4] },
});
