import { useColorScheme, useWindowDimensions, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
// oxlint-disable-next-line no-restricted-imports -- the rail capsule follows the pan gesture on the UI thread; Ease has no equivalent shared-value API.
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CreateTabButton } from "./create-tab-button";
import { GlassSurface } from "./glass-surface";
import { GlassTabButton } from "./glass-tab-button";
import { ScrollFade } from "./scroll-fade";
import { styles, darkStyles } from "./styles";
import { CREATE_SIZE, PILL_PADDING, TAB_WIDTH } from "./constants";
import { getTabIcon, hasTabIcon } from "./tab-icons";
import type { GlassTabBarProps } from "./types";
import { useTabBarPanGesture } from "./use-tab-bar-pan-gesture";

export function GlassTabBar({
  state,
  descriptors,
  navigation,
  onCreate,
  onCreateLongPress,
  createAccessibilityLabel,
  scopeControl,
}: GlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === "dark";
  const { width: windowWidth } = useWindowDimensions();

  const tabRoutes = state.routes.filter((route) => hasTabIcon(route.name));
  const focusedKey = state.routes[state.index]?.key;
  const focusedTabIndex = Math.max(
    0,
    tabRoutes.findIndex((route) => route.key === focusedKey),
  );
  const tabWidth = Math.max(
    28,
    Math.min(
      TAB_WIDTH,
      (windowWidth - 8 * 2 - 8 * 2 - CREATE_SIZE * 2 - PILL_PADDING * 2) /
        Math.max(tabRoutes.length, 1),
    ),
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
    tabWidth,
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
              { width: tabWidth },
              capsuleStyle,
            ]}
          />
          {tabRoutes.map((route) => {
            const icon = getTabIcon(route.name);
            if (!icon) return null;

            const { options } = descriptors[route.key];
            const label = options.title ?? route.name;
            const isFocused = route.key === focusedKey;

            return (
              <GlassTabButton
                key={route.key}
                label={label}
                icon={icon}
                isFocused={isFocused}
                onPress={() => handleTabPress(route.key, route.name, isFocused)}
                width={tabWidth}
              />
            );
          })}
          <View pointerEvents="none" style={styles.insetShadow} />
        </GlassSurface>
      </GestureDetector>
      {scopeControl}
      <CreateTabButton
        accessibilityLabel={createAccessibilityLabel}
        onLongPress={onCreateLongPress}
        onPress={onCreate}
      />
    </View>
  );
}
