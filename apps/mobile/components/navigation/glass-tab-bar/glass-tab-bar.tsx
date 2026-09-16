import { useColorScheme, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";

import { CreateTabButton } from "./create-tab-button";
import { GlassSurface } from "./glass-surface";
import { GlassTabButton } from "./glass-tab-button";
import { ScrollFade } from "./scroll-fade";
import { styles, darkStyles } from "./styles";
import { getTabIcon, hasTabIcon } from "./tab-icons";
import type { GlassTabBarProps } from "./types";
import { useTabBarPanGesture } from "./use-tab-bar-pan-gesture";

export function GlassTabBar({ state, descriptors, navigation }: GlassTabBarProps) {
  const posthog = usePostHog();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === "dark";
  const isMoneyMovementEnabled = posthog.getFeatureFlag("enable-money-movement");

  const tabRoutes = state.routes
    .filter((route) => hasTabIcon(route.name))
    .filter((route) => {
      if (route.name === "money-movement" && !isMoneyMovementEnabled) {
        return false;
      }
      return true;
    });
  const focusedKey = state.routes[state.index]?.key;
  const focusedTabIndex = Math.max(
    0,
    tabRoutes.findIndex((route) => route.key === focusedKey),
  );

  const navigateToIndex = (index: number) => {
    const route = tabRoutes[index];
    if (!route || route.key === focusedKey) return;

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const { panGesture, capsuleStyle } = useTabBarPanGesture({
    focusedIndex: focusedTabIndex,
    tabCount: tabRoutes.length,
    onSelect: navigateToIndex,
  });

  const handleTabPress = (routeKey: string, routeName: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: "tabPress",
      target: routeKey,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: insets.bottom + 8 }]}>
      <ScrollFade />
      <GestureDetector gesture={panGesture}>
        <GlassSurface style={styles.pill}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.capsule,
              styles.capsuleOverlay,
              isDark && darkStyles.capsuleOverlay,
              capsuleStyle,
            ]}
          />
          {tabRoutes.map((route) => {
            const icon = getTabIcon(route.name);
            if (!icon) return null;

            const { options } = descriptors[route.key];
            const label = (options.title ?? route.name) as string;
            const isFocused = route.key === focusedKey;

            return (
              <GlassTabButton
                key={route.key}
                label={label}
                icon={icon}
                isFocused={isFocused}
                onPress={() => handleTabPress(route.key, route.name, isFocused)}
              />
            );
          })}
          <View pointerEvents="none" style={styles.insetShadow} />
        </GlassSurface>
      </GestureDetector>
      <CreateTabButton />
    </View>
  );
}
