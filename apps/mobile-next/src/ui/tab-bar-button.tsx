import { EaseView } from "react-native-ease";
import { Pressable, StyleSheet, useColorScheme } from "react-native";

import { colors, rawColorValues, spacing } from "./design-tokens";
import { Icon } from "./icon";
import { motionTransition, PRESS_TRANSITION, useReducedMotion } from "./motion";
import { Text } from "./text";
import type { TabBarItem } from "./tab-bar-types";

interface TabBarButtonProps {
  item: TabBarItem;
  selected: boolean;
  onPress: () => void;
  width: number;
}

export function TabBarButton({ item, selected, onPress, width }: TabBarButtonProps) {
  const reducedMotion = useReducedMotion();
  const scheme = useColorScheme();
  const foreground =
    scheme === "dark" ? rawColorValues.dark.foreground : rawColorValues.light.foreground;

  return (
    <Pressable
      accessibilityLabel={item.label}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      hitSlop={4}
      onPress={onPress}
      style={styles.button}
    >
      {({ pressed }) => (
        <EaseView
          animate={{ opacity: pressed ? 0.72 : 1, scale: pressed ? 0.96 : 1 }}
          pointerEvents="none"
          transition={motionTransition(reducedMotion, PRESS_TRANSITION)}
          style={[styles.content, { width }]}
        >
          <Icon
            name={item.icon}
            color={selected ? colors.foreground : `${foreground}99`}
            size={22}
            weight={selected ? "fill" : "regular"}
          />
          <Text variant="caption" style={[styles.label, selected && styles.selectedLabel]}>
            {item.label}
          </Text>
        </EaseView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    minHeight: spacing[14],
    minWidth: 0,
  },
  content: {
    alignItems: "center",
    gap: 2,
    justifyContent: "center",
    minHeight: spacing[14],
    width: "100%",
  },
  label: {
    color: colors.mutedForeground,
    fontSize: 11,
  },
  selectedLabel: {
    color: colors.foreground,
    fontFamily: "Nunito_600SemiBold",
  },
});
