import { CaretRightIcon } from "phosphor-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

import type { CategoryRowProps } from "./types";

export function CategoryRow({ category, onPress }: CategoryRowProps) {
  return (
    <Pressable
      aria-label={category.lifecycle === "archived" ? `${category.name}, Archived` : category.name}
      role="button"
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
    >
      <View style={[styles.colorDot, { backgroundColor: category.color }]} />
      <Text style={styles.name}>{category.name}</Text>
      {category.lifecycle === "archived" ? (
        <Text style={styles.archivedBadge}>Archived</Text>
      ) : null}
      <Icon as={CaretRightIcon} style={styles.caret} size={14} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  containerPressed: {
    backgroundColor: colors.surfaceDim,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
  },
  name: {
    flex: 1,
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  archivedBadge: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
  caret: {
    color: colors.ink,
    opacity: 0.2,
  },
});
