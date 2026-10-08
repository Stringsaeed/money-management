import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { colors, radii, spacing } from "@/ui/design-tokens";

interface BreadcrumbBarProps {
  readonly children: ReactNode;
}

/** The recessed pill under an editor's title that holds its breadcrumb segments. */
export function BreadcrumbBar({ children }: BreadcrumbBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // iOS still exposes the hidden vertical indicator as a "scroll bar" accessibility element.
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii["2xl"],
    flexGrow: 0,
    marginHorizontal: spacing[5],
    alignSelf: "flex-start",
  },
  row: { alignItems: "center", gap: spacing[1.5], padding: spacing[2] },
});
