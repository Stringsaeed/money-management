import { StyleSheet, View } from "react-native";

import type { V2EnvelopeGroup } from "@trove/api/v2/contracts";

import { DENSE_MAX_FONT_SCALE, PlanAmountRow, Text } from "@/ui/trove";

import type { EnvelopeLine } from "../home/home-model";

import { GROUP_LABEL } from "./envelope-emoji";

interface PlanAdjustGroupProps {
  readonly group: V2EnvelopeGroup;
  readonly lines: readonly EnvelopeLine[];
  readonly currency: string;
  /** The group's total as typed, e.g. "4,675". */
  readonly total: string;
  readonly valueOf: (line: EnvelopeLine) => string;
  readonly onChange: (envelopeId: string, text: string) => void;
  readonly emojiOf: (line: EnvelopeLine) => string;
  readonly hintOf: (line: EnvelopeLine) => string | undefined;
}

/** One group's envelopes, each with its plan amount to type, under a mono "BILLS · 4,675" stamp. */
export function PlanAdjustGroup({
  group,
  lines,
  currency,
  total,
  valueOf,
  onChange,
  emojiOf,
  hintOf,
}: PlanAdjustGroupProps) {
  return (
    <View>
      <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={styles.heading}
        tone="tertiary"
        variant="stamp"
      >
        {`${GROUP_LABEL[group]} · ${total}`}
      </Text>
      {lines.map((line) => (
        <PlanAmountRow
          currency={currency}
          emoji={emojiOf(line)}
          hint={hintOf(line)}
          key={line.envelope.id}
          name={line.envelope.name}
          onChangeText={(text) => onChange(line.envelope.id, text)}
          value={valueOf(line)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: 2 },
});
