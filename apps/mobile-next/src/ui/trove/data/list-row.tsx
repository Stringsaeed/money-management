import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Icon, type IconName } from "../icon";
import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, layout, space } from "../tokens";
import { ListRowIcon } from "./list-row-icon";
import { PressableRow } from "./pressable-row";

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Neutral 32pt icon tile. Ignored when `leading` is given. */
  icon?: IconName;
  /** Custom leading content, e.g. a `CategoryTile` or avatar. */
  leading?: ReactNode;
  /** Quiet value before the chevron, e.g. "USD". */
  value?: string;
  /** Trailing slot: a switch, an `Amount`, a badge. Drawn before the value. */
  trailing?: ReactNode;
  /** Shows the disclosure chevron. */
  chevron?: boolean;
  /** Red title and tile, for "Sign out" or "Delete account". */
  destructive?: boolean;
  /** Makes the whole row a button. Leave out when `trailing` holds its own control. */
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

/** Settings and list row: leading tile, title and subtitle, then value, slot and chevron. */
export function ListRow({
  title,
  subtitle,
  icon,
  leading,
  value,
  trailing,
  chevron = false,
  destructive = false,
  onPress,
  accessibilityLabel,
  testID,
}: ListRowProps) {
  const lead = leading ?? (icon ? <ListRowIcon destructive={destructive} name={icon} /> : null);

  return (
    <PressableRow
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.row, subtitle ? styles.rowWithSubtitle : null]}
      testID={testID}
    >
      {lead}
      <View style={styles.text}>
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          tone={destructive ? "negative" : "primary"}
          variant="labelMd"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="secondary" variant="bodySm">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {value ? (
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="secondary" variant="bodyMd">
          {value}
        </Text>
      ) : null}
      {chevron ? <Icon color={colors.text.tertiary} name="chevron-right" size={16} /> : null}
    </PressableRow>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    minHeight: layout.listRowMinHeight - space[2],
    paddingHorizontal: layout.cardPadding,
    paddingVertical: space[2],
  },
  rowWithSubtitle: {
    minHeight: layout.listRowMinHeight,
  },
  text: {
    flex: 1,
    gap: space[0.5],
    minWidth: 0,
  },
});
