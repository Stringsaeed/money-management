import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { space, Text } from "@/ui/trove";

interface ToggleRowProps {
  label: string;
  children: ReactNode;
}

export function ToggleRow({ label, children }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <Text variant="labelMd">{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
    paddingRight: space[1],
  },
});
