import { Pressable, useColorScheme } from "react-native";

import type { IconName } from "@/ui/icon";
import { Icon } from "@/ui/icon";

import { styles, darkStyles } from "./styles";

interface GlassTabButtonProps {
  label: string;
  icon: IconName;
  isFocused: boolean;
  onPress: () => void;
  width?: number;
}

export function GlassTabButton({ label, icon, isFocused, onPress, width }: GlassTabButtonProps) {
  const isDark = useColorScheme() === "dark";

  const iconStyle = isFocused
    ? styles.iconFocused
    : isDark
      ? darkStyles.iconUnfocused
      : styles.iconUnfocused;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.tab, width !== undefined && { width }]}
    >
      <Icon name={icon} size={24} weight={isFocused ? "fill" : "regular"} style={iconStyle} />
    </Pressable>
  );
}
