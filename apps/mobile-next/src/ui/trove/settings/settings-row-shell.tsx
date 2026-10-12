import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { PressableScale } from "../pressable-scale";
import { colors, layout, space } from "../tokens";

interface SettingsRowShellProps {
  children: ReactNode;
  /** Spoken line for the whole row. */
  label: string;
  /** Leave out for a row that does nothing on its own. */
  onPress?: () => void;
  /** A row holding its own control stays open so the control remains reachable. */
  grouped: boolean;
  testID?: string;
}

export const SETTINGS_ROW_HEIGHT = 52;

/** A settings row's 52pt body: a button that fills on press, or a plain view. */
export function SettingsRowShell({
  children,
  label,
  onPress,
  grouped,
  testID,
}: SettingsRowShellProps) {
  if (onPress) {
    return (
      <PressableScale
        accessibilityLabel={label}
        accessibilityRole="button"
        onPress={onPress}
        pressedStyle={styles.pressed}
        scaleOnPress={false}
        style={styles.row}
        testID={testID}
      >
        {children}
      </PressableScale>
    );
  }
  return (
    <View
      accessibilityLabel={grouped ? label : undefined}
      accessible={grouped}
      style={styles.row}
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    minHeight: SETTINGS_ROW_HEIGHT,
    paddingHorizontal: layout.cardPadding,
    paddingVertical: space[2],
  },
  pressed: { backgroundColor: colors.fill.neutral },
});
