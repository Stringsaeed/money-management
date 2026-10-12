import { Children, isValidElement, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, elevation, layout, radius, space } from "../tokens";
import { SETTINGS_ICON_TILE } from "./settings-row-icon";

export interface SettingsSectionProps {
  /** Mono stamp above the card, e.g. "Money". Drawn in capitals. */
  title: string;
  /** Caption under the card in bodySm text.tertiary. */
  footer?: string;
  /** `SettingsRow`s, divided by 1pt rules that start at the titles. */
  children: ReactNode;
}

/** Divider starts where row titles do: card padding, the round tile and its gap. */
const DIVIDER_INSET = layout.cardPadding + SETTINGS_ICON_TILE + space[3];

/** Settings board group: a stamp label, then a rounded card of rows. */
export function SettingsSection({ title, footer, children }: SettingsSectionProps) {
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View style={styles.section}>
      <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={styles.title}
        tone="tertiary"
        variant="stamp"
      >
        {title}
      </Text>
      <View style={[styles.card, elevation.level1]}>
        {rows.map((row, index) => (
          <View key={row.key}>
            {row}
            {/* Drawn over the row's top edge so every row keeps the board's 52pt. */}
            {index > 0 ? <View pointerEvents="none" style={styles.divider} /> : null}
          </View>
        ))}
      </View>
      {footer ? (
        <Text style={styles.footer} tone="tertiary" variant="bodySm">
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[2] },
  // The board sets the stamp on a 16pt line.
  title: { lineHeight: 16, paddingHorizontal: space[1] },
  card: {
    backgroundColor: colors.surface.default,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  divider: {
    backgroundColor: colors.border.subtle,
    height: 1,
    left: DIVIDER_INSET,
    position: "absolute",
    right: layout.cardPadding,
    top: 0,
  },
  footer: { paddingHorizontal: space[1] },
});
