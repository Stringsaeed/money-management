import { Pressable, StyleSheet, Text as NativeText } from "react-native";

import { colors, radii, spacing, typography } from "@/ui/design-tokens";
import { Text } from "@/ui/text";

interface OptionTileProps {
  readonly emoji: string;
  readonly label: string;
  readonly selected: boolean;
  /** Hex color from data; the selected tile takes a 20% tint of it. */
  readonly tint?: string;
  readonly onPress: () => void;
}

/** Emoji-over-label tile used by the editor sheets (categories, account types, create actions). */
export function OptionTile({ emoji, label, selected, tint, onPress }: OptionTileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.tile,
        // Dynamic category color from data: 20% alpha tint on the selected tile.
        selected && (tint ? { backgroundColor: `${tint}33` } : styles.tileSelected),
      ]}
    >
      <NativeText style={styles.emoji}>{emoji}</NativeText>
      <Text numberOfLines={1} style={[styles.label, !selected && styles.labelIdle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.xl,
    gap: spacing[1.5],
    minWidth: spacing[20],
    maxWidth: spacing[32],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  tileSelected: { backgroundColor: colors.surfaceDim },
  emoji: { color: colors.ink, fontSize: typography.text2xl },
  label: {
    color: colors.ink,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
  },
  labelIdle: { opacity: 0.55 },
});
