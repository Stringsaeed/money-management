import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { colors, elevation, radius, space } from "../tokens";

export interface ChartCardProps {
  title?: string;
  /** Right of the title, e.g. `Last 14 days`. */
  subtitle?: string;
  children: ReactNode;
}

/** The surface every chart sits on: surface.default, radius.lg, level1 lift. */
export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <View style={styles.card}>
      {title ? (
        <View style={styles.header}>
          <Text accessibilityRole="header" variant="titleSm">
            {title}
          </Text>
          {subtitle ? (
            <Text tone="secondary" variant="bodySm">
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...elevation.level1,
    backgroundColor: colors.surface.default,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    gap: space[4],
    padding: space[5],
  },
  header: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: space[3],
    justifyContent: "space-between",
  },
});
