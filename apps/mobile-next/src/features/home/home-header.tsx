import { Stack } from "expo-router/stack";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { colors, radii } from "@/ui/design-tokens";
import { Icon } from "@/ui/icon";
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
    <Stack.Screen
      options={{
        title: `Hello, ${name}`,
        // Android has no native scroll-edge material behind a transparent header.
        headerBackground:
          Platform.OS === "android" ? () => <View style={styles.scrim} /> : undefined,
        headerLeft: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={onOpenProfile}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <SeedAvatar seed={seed} name={name} size={42} />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter overview"
            onPress={onOpenFilters}
            style={({ pressed }) => [styles.filter, pressed && styles.pressed]}
          >
            <Icon name="funnel" size={22} color={tileColors.ink} />
          </Pressable>
        ),
      }}
    />
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.background, opacity: 0.92 },
  avatar: {
    marginRight: Platform.OS === "android" ? 8 : 0,
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  filter: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: tileColors.pink,
    borderWidth: 1,
    borderColor: tileColors.grout,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 3px rgba(32, 49, 33, 0.08)",
  },
  pressed: { opacity: 0.65 },
});
