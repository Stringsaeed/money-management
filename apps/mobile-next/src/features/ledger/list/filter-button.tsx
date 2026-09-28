import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";
import { colors, radii, spacing, typography } from "@/ui/design-tokens";

interface FilterButtonProps {
  readonly count: number;
  readonly onPress: () => void;
  /** `pill` shows a "Filter" label beside the icon; `icon` is a round icon button. */
  readonly appearance?: "icon" | "pill";
}

export function FilterButton({ count, onPress, appearance = "icon" }: FilterButtonProps) {
  const active = count > 0;
  const tint = active ? colors.primaryForeground : colors.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? `Filters, ${count} applied` : "Filters"}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        appearance === "pill" ? styles.pill : styles.icon,
        active && styles.active,
        pressed && styles.pressed,
      ]}
    >
      <Icon name="funnel" size={18} weight={active ? "fill" : "regular"} color={tint} />
      {appearance === "pill" ? (
        <Text style={[styles.label, { color: tint }]}>
          {active ? `Filters · ${count}` : "Filter"}
        </Text>
      ) : null}
      {appearance === "icon" && active ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.full,
    height: spacing[11],
    justifyContent: "center",
    width: spacing[11],
  },
  pill: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.full,
    flexDirection: "row",
    gap: spacing[1.5],
    height: spacing[10],
    paddingHorizontal: spacing[4],
  },
  active: { backgroundColor: colors.primary },
  pressed: { opacity: 0.7 },
  label: { fontFamily: typography.fontBodySemibold, fontSize: typography.textSm },
  badge: {
    alignItems: "center",
    backgroundColor: colors.terracotta,
    borderColor: colors.background,
    borderRadius: radii.full,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    minWidth: 20,
    paddingHorizontal: spacing[1],
    position: "absolute",
    right: -4,
    top: -4,
  },
  badgeText: {
    color: colors.primaryForeground,
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
});
