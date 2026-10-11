import { Pressable, StyleSheet } from "react-native";

import { Icon } from "../icon";
import { colors, motion, radius } from "../tokens";

interface NoteClearButtonProps {
  label: string;
  onPress: () => void;
}

/** 36pt clear disc inside the pill; hitSlop lifts it to 44pt. */
export function NoteClearButton({ label, onPress }: NoteClearButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={motion.hitSlop / 2}
      onPress={onPress}
      style={styles.clear}
    >
      <Icon color={colors.text.secondary} name="close" size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clear: {
    alignItems: "center",
    backgroundColor: colors.fill.neutral,
    borderRadius: radius.full,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
});
