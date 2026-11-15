import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors, radius } from "@/ui/trove";

/**
 * B2/B3 field card: rows on the surface tone in one ringed card, split by divider lines.
 * Trove `ListGroup` rows are 64pt list rows; these are 50–52pt form rows.
 */
export function FieldGroup({ children }: { readonly children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <View style={styles.card}>
      {rows.map((row, index) => (
        <Fragment key={isValidElement(row) && row.key !== null ? row.key : index}>
          {index > 0 ? <View style={styles.divider} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.subtle,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: { backgroundColor: colors.border.subtle, height: 1 },
});
