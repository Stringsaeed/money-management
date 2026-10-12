import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import type { IconName } from "../icon";
import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE, fonts } from "../tokens";
import { SettingsRowEnd } from "./settings-row-end";
import { SettingsRowIcon } from "./settings-row-icon";
import { SettingsRowShell } from "./settings-row-shell";
import { settingsRowLabel } from "./utils";

export interface SettingsRowProps {
  title: string;
  /** Icon in the round leading tile. */
  icon: IconName;
  /** Quiet mono value before the chevron, e.g. "AED" or a count. */
  value?: string;
  /** A control that owns its own press, e.g. a `Switch`. Replaces value and chevron. */
  trailing?: ReactNode;
  /** Shows the disclosure chevron. */
  chevron?: boolean;
  /** Not built yet: a compact Soon badge replaces the right edge and the row does nothing. */
  soon?: boolean;
  /** Red tile and heavier red title, for "Erase all data" or "Sign out". */
  destructive?: boolean;
  /** Makes the row a button. Leave out when `trailing` holds its own control. */
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

/** Settings board row: 52pt, round icon tile, title, then a mono value and chevron or a control. */
export function SettingsRow({
  title,
  icon,
  value,
  trailing,
  chevron = false,
  soon = false,
  destructive = false,
  onPress,
  accessibilityLabel,
  testID,
}: SettingsRowProps) {
  return (
    <SettingsRowShell
      grouped={trailing === undefined || soon}
      label={accessibilityLabel ?? settingsRowLabel({ title, value, soon })}
      onPress={soon ? undefined : onPress}
      testID={testID}
    >
      <SettingsRowIcon destructive={destructive} name={icon} />
      <Text
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[styles.title, destructive ? styles.destructiveTitle : null]}
        tone={destructive ? "negative" : "primary"}
        variant="labelMd"
      >
        {title}
      </Text>
      <SettingsRowEnd chevron={chevron} soon={soon} trailing={trailing} value={value} />
    </SettingsRowShell>
  );
}

const styles = StyleSheet.create({
  title: { flex: 1, fontFamily: fonts.semibold, minWidth: 0 },
  destructiveTitle: { fontFamily: fonts.extrabold },
});
