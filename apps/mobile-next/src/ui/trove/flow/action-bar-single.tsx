import { StyleSheet, Text as NativeText } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts } from "../tokens";
import { ActionBarLead } from "./action-bar-lead";
import type { ActionBarSummaryValue } from "./action-bar-summary";
import type { ActionBarPrimary } from "./action-bar-types";
import { FlowButton } from "./flow-button";

interface ActionBarSingleProps {
  primary: ActionBarPrimary;
  caption?: string;
  summary?: ActionBarSummaryValue;
  note?: string;
}

/**
 * One primary: under a centered caption (stacked), beside a summary or note (hugging its
 * label), or alone across the bar.
 */
export function ActionBarSingle({ primary, caption, summary, note }: ActionBarSingleProps) {
  const stacked = caption !== undefined;
  const lead = !stacked && (Boolean(summary) || note !== undefined);

  return (
    <>
      {stacked ? (
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.caption}>
          {caption}
        </NativeText>
      ) : null}
      {lead ? <ActionBarLead note={note} summary={summary} /> : null}
      <FlowButton
        {...primary}
        size="bar"
        style={stacked || lead ? null : styles.fill}
        tone={primary.tone ?? "accent"}
      />
    </>
  );
}

const styles = StyleSheet.create({
  caption: {
    color: colors.text.tertiary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  fill: { flex: 1 },
});
