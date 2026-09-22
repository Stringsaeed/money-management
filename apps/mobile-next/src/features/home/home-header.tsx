import { format } from "date-fns";
import { Pressable, StyleSheet, View } from "react-native";

import { spacing, typography, colors } from "@/ui/design-tokens";
import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";
import { SeedAvatar } from "@/ui/tiled-garden/seed-avatar";
import { tileColors } from "@/ui/tiled-garden/tile-tokens";

interface HomeHeaderProps {
  readonly name: string;
  readonly seed: string;
  readonly onOpenFilters: () => void;
  readonly onOpenProfile: () => void;
}

export function HomeHeader({ name, seed, onOpenFilters, onOpenProfile }: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        onPress={onOpenProfile}
      >
        <SeedAvatar seed={seed} name={name} size={48} />
      </Pressable>
      <View style={styles.greeting}>
        <Text style={styles.date}>{format(new Date(), "EEEE, d MMMM")}</Text>
        <Text variant="headline" style={styles.title}>
          Hello, {name}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Filter overview"
        onPress={onOpenFilters}
        style={({ pressed }) => [styles.filter, pressed && styles.pressed]}
      >
        <Icon name="funnel" size={22} color={tileColors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[3],
  },
  greeting: { flex: 1, gap: spacing[0.5] },
  date: {
    color: colors.mutedForeground,
    fontSize: typography.textXs,
    fontFamily: typography.fontBodyMedium,
  },
  title: { fontFamily: typography.fontBodyBold, fontSize: typography.textXl },
  filter: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: tileColors.pink,
    borderWidth: 1,
    borderColor: tileColors.grout,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 3px rgba(32, 49, 33, 0.08)",
  },
  pressed: { opacity: 0.65 },
});
