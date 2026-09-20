import type { Icon as PhosphorIcon } from "phosphor-react-native";
import { Pressable, useColorScheme } from "react-native";

import { Icon } from "@/components/ui/icon";

import { styles, darkStyles } from "./styles";

interface GlassTabButtonProps {
  label: string;
  icon: PhosphorIcon;
  isFocused: boolean;
  onPress: () => void;
}

export function GlassTabButton({ label, icon, isFocused, onPress }: GlassTabButtonProps) {
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
      style={styles.tab}
    >
      <Icon as={icon} size={24} weight={isFocused ? "fill" : "regular"} style={iconStyle} />
    </Pressable>
  );
}
