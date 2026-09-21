import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "./design-tokens";
import { Text } from "./text";

export interface SectionProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Section({ title, action, children }: SectionProps) {
  return (
    <View style={styles.section}>
      {title || action ? (
        <View style={styles.header}>
          {title ? <Text variant="title">{title}</Text> : <View />}
          {action}
        </View>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing[3],
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  content: {
    gap: spacing[2],
  },
});
