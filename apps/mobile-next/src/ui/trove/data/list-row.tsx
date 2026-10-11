import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { Icon, type IconName } from "../icon";
import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, layout, space } from "../tokens";
import { ListRowLead } from "./list-row-lead";
import { ListRowText } from "./list-row-text";
import { PressableRow } from "./pressable-row";
import { selectableRowProps } from "./utils";

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
  /**
   * Makes the row selectable: a checkbox in the leading slot, and the whole row becomes a
   * `checkbox` for assistive tech with this checked state. Ignored when `leading` is given.
   */
  checked?: boolean;
  /** A selectable row that cannot change: dimmed box and title, not pressable. */
  disabled?: boolean;
  /** Makes the whole row a button (a checkbox when `checked` is set). Leave out when `trailing` holds its own control. */
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
  checked,
  disabled = false,
  onPress,
  accessibilityLabel,
  testID,
}: ListRowProps) {
  const lead = (
    <ListRowLead
      checked={checked}
      destructive={destructive}
      disabled={disabled}
      icon={icon}
      leading={leading}
    />
  );

  return (
    <PressableRow
      {...selectableRowProps({ checked, disabled, title, accessibilityLabel })}
      onPress={disabled ? undefined : onPress}
      style={[styles.row, subtitle ? styles.rowWithSubtitle : null]}
      testID={testID}
    >
      {lead}
      <ListRowText
        subtitle={subtitle}
        title={title}
        tone={destructive ? "negative" : disabled ? "disabled" : "primary"}
      />
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
});
