import { Stack } from "expo-router/stack";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { SeedAvatar } from "@/ui/tiled-garden/seed-avatar";
import { colors, IconButton, layout, radius, space } from "@/ui/trove";

interface HomeHeaderProps {
  readonly name: string;
  readonly seed: string;
  readonly onOpenFilters: () => void;
  readonly onOpenProfile: () => void;
}

// The native stack header keeps the profile avatar: Trove `Header` has no leading slot and
// there is no Trove avatar, so `SeedAvatar` stays on its legacy implementation.
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
          <IconButton
            icon="filter"
            accessibilityLabel="Filter overview"
            onPress={onOpenFilters}
            variant="neutral"
          />
        ),
      }}
    />
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.bg.canvas, opacity: 0.92 },
  avatar: {
    marginRight: Platform.OS === "android" ? space[2] : 0,
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.65 },
});
