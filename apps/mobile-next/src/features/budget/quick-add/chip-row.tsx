import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { space, Text } from "@/ui/trove";

interface ChipRowProps {
  readonly label: string;
  readonly children: ReactNode;
}

/** A labelled, sideways-scrolling row of chips. */
export function ChipRow({ label, children }: ChipRowProps) {
  return (
    <View style={styles.row}>
      <Text tone="secondary" variant="labelSm">
        {label}
      </Text>
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
  row: { gap: space[1] },
  chips: { gap: space[2] },
});
