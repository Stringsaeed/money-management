import { TrashIcon } from "phosphor-react-native";
import { Pressable, StyleSheet, useColorScheme } from "react-native";

import { Icon } from "@/components/ui/icon";
import { radii, rawColorValues, spacing } from "@/lib/design-tokens";

interface ResourceSheetDeleteButtonProps {
  label: string;
  onPress: VoidFunction;
}

export function ResourceSheetDeleteButton({ label, onPress }: ResourceSheetDeleteButtonProps) {
  const colorScheme = useColorScheme();
  const destructiveHex =
    colorScheme === "dark" ? rawColorValues.dark.destructive : rawColorValues.light.destructive;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && { backgroundColor: `${destructiveHex}1A` },
      ]}
    >
      <Icon as={TrashIcon} size={20} style={{ color: destructiveHex }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: spacing[10],
    width: spacing[10],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
  },
});
