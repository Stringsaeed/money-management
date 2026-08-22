import type { Icon as PhosphorIcon } from "phosphor-react-native";
import { Pressable } from "react-native";

import { Icon } from "@/components/ui/icon";

import { styles } from "./styles";

interface GlassTabButtonProps {
  label: string;
  icon: PhosphorIcon;
  isFocused: boolean;
  onPress: () => void;
}

export function GlassTabButton({ label, icon, isFocused, onPress }: GlassTabButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.tab}
    >
      <Icon
        as={icon}
        size={24}
        weight={isFocused ? "fill" : "regular"}
        className={isFocused ? "text-foreground" : "text-foreground/55"}
      />
    </Pressable>
  );
}
