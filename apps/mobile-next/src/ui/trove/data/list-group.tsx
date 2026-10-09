import { Children, isValidElement, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { colors, elevation, layout, radius, space } from "../tokens";

export interface ListGroupProps {
  /** Small label above the group, e.g. "Preferences". */
  header?: string;
  /** Caption under the group in bodySm text.tertiary. */
  footer?: string;
  /** Left inset of the hairline dividers. 60 clears a 32pt tile, 68 a 40pt tile, 0 spans the row. */
  dividerInset?: number;
  children: ReactNode;
}

/** 32pt tile plus its 12pt gap inside the 16pt row padding. */
const DEFAULT_DIVIDER_INSET = layout.cardPadding + 32 + space[3];

/** Rounded group of rows with hairline dividers between them. */
export function ListGroup({
  header,
  footer,
  dividerInset = DEFAULT_DIVIDER_INSET,
  children,
}: ListGroupProps) {
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View style={styles.wrapper}>
      {header ? (
        <Text accessibilityRole="header" style={styles.note} tone="secondary" variant="labelSm">
          {header}
        </Text>
      ) : null}
      <View style={[styles.group, elevation.level1]}>
        {rows.map((row, index) => (
          <View key={row.key}>
            {index > 0 ? <View style={[styles.divider, { marginLeft: dividerInset }]} /> : null}
            {row}
          </View>
        ))}
      </View>
      {footer ? (
        <Text style={styles.note} tone="tertiary" variant="bodySm">
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: space[2],
  },
  group: {
    backgroundColor: colors.surface.default,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  divider: {
    backgroundColor: colors.border.subtle,
    height: StyleSheet.hairlineWidth,
  },
  note: {
    paddingHorizontal: space[1],
  },
});
