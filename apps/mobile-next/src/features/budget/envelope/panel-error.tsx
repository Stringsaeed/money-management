import { StyleSheet } from "react-native";

import { colors, typography } from "@/ui/design-tokens";
import { Text } from "@/ui/text";

/** Failure copy under a panel's action. Announced so it is not colour only. */
export function PanelError({ message }: { readonly message: string | undefined }) {
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.destructive, fontFamily: typography.fontBodyMedium },
});
