import { StyleSheet } from "react-native";

import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE } from "../tokens";
import { ActionBarSummary, type ActionBarSummaryValue } from "./action-bar-summary";

interface ActionBarLeadProps {
  summary?: ActionBarSummaryValue;
  note?: string;
}

/** Left of a hugging primary: the mono summary, else the note sentence. */
export function ActionBarLead({ summary, note }: ActionBarLeadProps) {
  if (summary) return <ActionBarSummary {...summary} />;
  return (
    <Text
      maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
      style={styles.note}
      tone="secondary"
      variant="bodySm"
    >
      {note}
    </Text>
  );
}

const styles = StyleSheet.create({
  note: { flex: 1 },
});
