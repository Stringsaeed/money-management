import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";

interface ChipRowProps {
  readonly label: string;
  readonly children: ReactNode;
}

/** A labelled, sideways-scrolling row of chips. */
export function ChipRow({ label, children }: ChipRowProps) {
  return (
    <View style={styles.row}>
      <Text variant="label">{label}</Text>
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing[1] },
  chips: { gap: spacing[2] },
});
