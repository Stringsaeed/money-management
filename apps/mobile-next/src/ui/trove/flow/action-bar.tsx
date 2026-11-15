import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, layout, space } from "../tokens";
import { ActionBarPair } from "./action-bar-pair";
import { ActionBarSingle } from "./action-bar-single";
import type { ActionBarSummaryValue } from "./action-bar-summary";
import type { ActionBarPrimary, ActionBarSecondary } from "./action-bar-types";
import { actionBarLayout } from "./utils";

export interface ActionBarProps {
  primary: ActionBarPrimary;
  /** Mono caption and figure left of the primary, e.g. MONEY TO PLAN · AED 14,200. */
  summary?: ActionBarSummaryValue;
  /** Short sentence left of the primary, e.g. "You can change any of this later." */
  note?: string;
  /** Second button beside the primary. */
  secondary?: ActionBarSecondary;
  /** Centered line above a full-width primary, e.g. "Only money you have…". Wins over the rest. */
  caption?: string;
  /** Pads the bottom to the home-indicator inset (min 14). Off inside a sheet that already does. */
  safeArea?: boolean;
  testID?: string;
}

const MIN_BOTTOM = 14;

/**
 * Sticky bottom bar of the budgeting flows: canvas fill, a hairline on top, and one primary
 * pill. The left side carries a summary, a note, or a second button; with none of them, or
 * with a caption, the primary spans the bar.
 */
export function ActionBar({
  primary,
  summary,
  note,
  secondary,
  caption,
  safeArea = true,
  testID,
}: ActionBarProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(safeArea ? insets.bottom : 0, MIN_BOTTOM);
  const arrangement = actionBarLayout({ caption, secondary });

  return (
    <View style={[styles.bar, layoutStyles[arrangement], { paddingBottom }]} testID={testID}>
      {secondary && arrangement !== "caption" ? (
        <ActionBarPair primary={primary} secondary={secondary} />
      ) : (
        <ActionBarSingle caption={caption} note={note} primary={primary} summary={summary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.bg.canvas,
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    paddingHorizontal: layout.screenGutter,
  },
});

const row = { alignItems: "center", flexDirection: "row", gap: space[3], paddingTop: 14 } as const;

const layoutStyles = StyleSheet.create({
  caption: { gap: space[2], paddingTop: space[3] },
  outline: { ...row, gap: 10 },
  text: row,
  row,
});
