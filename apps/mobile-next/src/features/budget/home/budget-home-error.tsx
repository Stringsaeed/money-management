import { StyleSheet, View } from "react-native";

import { Button } from "@/ui/button";
import { spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";

/** The numbers could not be loaded or refreshed: say so and offer Retry, never a 0 or an old value. */
export function BudgetHomeError({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text variant="title">{"Couldn't calculate"}</Text>
      <Text variant="body">Your numbers are hidden until we can load them again.</Text>
      <Button title="Retry" variant="secondary" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "flex-start", gap: spacing[3] },
});
