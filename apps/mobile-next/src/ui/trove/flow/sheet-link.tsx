import { StyleSheet } from "react-native";

import { PressableScale } from "../pressable-scale";
import { colors, radius, space } from "../tokens";
import { SheetLinkContent } from "./sheet-link-content";
import { labelWithMeta } from "./utils";

export interface SheetLinkProps {
  emoji: string;
  label: string;
  /** Tertiary text before the chevron, e.g. "You, Sara". */
  meta?: string;
  onPress: () => void;
  /** Defaults to the label, plus the meta when there is one. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

/** Standalone link card in a sheet, e.g. ⚙️ Settings: 50pt, surface fill, 1pt ring, chevron. */
export function SheetLink({
  emoji,
  label,
  meta,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: SheetLinkProps) {
  return (
    <PressableScale
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? labelWithMeta(label, meta)}
      accessibilityRole="link"
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={styles.card}
      testID={testID}
    >
      <SheetLinkContent emoji={emoji} label={label} meta={meta} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.surface.default,
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: space[3],
    minHeight: 50,
    // The board's ring takes no space; 16pt from the outer edge.
    paddingHorizontal: space[4] - 1,
  },
  pressed: { backgroundColor: colors.fill.neutral },
});
