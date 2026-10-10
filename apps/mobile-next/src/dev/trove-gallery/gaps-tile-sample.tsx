import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { space, Text } from "@/ui/trove";

interface GapsTileSampleProps {
  label: string;
  children: ReactNode;
}

/** A tile with a caption under it. */
export function GapsTileSample({ label, children }: GapsTileSampleProps) {
  return (
    <View style={styles.sample}>
      {children}
      <Text tone="secondary" variant="labelSm">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sample: { alignItems: "center", gap: space[1] },
});
