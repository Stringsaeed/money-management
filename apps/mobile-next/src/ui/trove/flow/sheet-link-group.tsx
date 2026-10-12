import { StyleSheet, View } from "react-native";

import { PressableScale } from "../pressable-scale";
import { colors, radius, space } from "../tokens";
import { SheetLinkContent } from "./sheet-link-content";
import { labelWithMeta } from "./utils";
import type { SheetLinkProps } from "./sheet-link";

export type SheetLinkItem = Omit<SheetLinkProps, "testID"> & {
  /** Stable key; defaults to the label. */
  key?: string;
};

export interface SheetLinkGroupProps {
  links: readonly SheetLinkItem[];
  testID?: string;
}

/**
 * Links stacked in one ringed card (ledger sheet: 👥 Household members, ⚙️ Settings):
 * 52pt rows split by the ring tone.
 */
export function SheetLinkGroup({ links, testID }: SheetLinkGroupProps) {
  return (
    <View style={styles.card} testID={testID}>
      {links.map(
        ({ key, emoji, label, meta, onPress, accessibilityLabel, accessibilityHint }, index) => (
          <PressableScale
            accessibilityHint={accessibilityHint}
            accessibilityLabel={accessibilityLabel ?? labelWithMeta(label, meta)}
            accessibilityRole="link"
            key={key ?? label}
            onPress={onPress}
            pressedStyle={styles.pressed}
            scaleOnPress={false}
            style={[styles.row, index < links.length - 1 ? styles.divider : null]}
          >
            <SheetLinkContent emoji={emoji} label={label} meta={meta} />
          </PressableScale>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    minHeight: 52,
    // The board's ring takes no space; 16pt from the card's outer edge.
    paddingHorizontal: space[4] - 1,
  },
  divider: { borderBottomColor: colors.border.default, borderBottomWidth: 1 },
  pressed: { backgroundColor: colors.fill.neutral },
});
