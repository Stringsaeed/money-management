import { Pressable, StyleSheet } from "react-native";

import { Text } from "@/ui/text";
import { colors, typography } from "@/ui/design-tokens";

interface TextLinkProps {
  readonly label: string;
  readonly onPress?: () => void;
}

export function TextLink({ label, onPress }: TextLinkProps) {
  return (
    <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress}>
      {({ pressed }) => <Text style={[styles.link, pressed && styles.pressed]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    color: colors.sage,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
  },
  pressed: { opacity: 0.6 },
});
