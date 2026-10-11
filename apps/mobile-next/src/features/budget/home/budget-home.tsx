import { router } from "expo-router";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { colors, spacing } from "@/ui/design-tokens";
import { Section } from "@/ui/section";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import { pickAttention } from "./attention";
import { AttentionLine } from "./attention-line";
import { EverydayRow } from "./everyday-row";
import { GroupSummaryRow } from "./group-summary-row";
import { envelopeLines, groupSummary, perDayLine, type ActiveBudgetView } from "./home-model";
import { OverNotice } from "./over-notice";

interface BudgetHomeProps {
  readonly view: ActiveBudgetView;
  /** Scrolls the enclosing list so `y` is at the top. */
  readonly scrollToY: (y: number) => void;
}

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** M1: Safe to spend, the pace to payday, what needs attention, and the envelopes. */
export function BudgetHome({ view, scrollToY }: BudgetHomeProps) {
  const { current } = view;
  const lines = envelopeLines(view);
  const everyday = lines.filter((line) => line.envelope.group === "everyday");
  const attention = pickAttention({
    envelopes: lines.map(({ envelope, totals }) => ({
      name: envelope.name,
      leftMinor: totals.leftMinor,
    })),
    unassignedMinor: current.unassignedMinor,
  });
  const over = current.safeToSpendMinor <= 0;
  const everydayY = useRef(0);

  return (
    <View style={styles.container}>
      <View
        accessible
        accessibilityLabel={`Safe to spend ${money(current.safeToSpendMinor)}. ${perDayLine(current, money)}`}
        style={styles.hero}
      >
        <Text variant="label">Safe to spend</Text>
        <Text variant="amount" style={current.safeToSpendMinor < 0 && styles.negative}>
          {money(current.safeToSpendMinor)}
        </Text>
        <Text variant="caption">{perDayLine(current, money)}</Text>
      </View>

      {over ? (
        <OverNotice
          overMinor={-current.safeToSpendMinor}
          onAdjust={() => scrollToY(everydayY.current)}
        />
      ) : null}

      <AttentionLine attention={attention} />

      <View
        onLayout={(event) => {
          everydayY.current = event.nativeEvent.layout.y;
        }}
      >
        <Section title="Everyday">
          {everyday.length === 0 ? (
            <Text variant="caption">No everyday envelopes yet.</Text>
          ) : (
            everyday.map((line) => (
              <EverydayRow
                key={line.envelope.id}
                line={line}
                onPress={() =>
                  router.push({
                    pathname: "/budget/envelope/[id]",
                    params: { id: line.envelope.id },
                  })
                }
              />
            ))
          )}
        </Section>
      </View>

      <View style={styles.groups}>
        <GroupSummaryRow
          title="Bills"
          noun={{ one: "bill", many: "bills" }}
          leftLabel="left"
          summary={groupSummary(lines, "bills")}
        />
        <GroupSummaryRow
          title="Saving for"
          noun={{ one: "goal", many: "goals" }}
          leftLabel="set aside"
          summary={groupSummary(lines, "saving")}
        />
      </View>

      <Button title="+ Add spending" onPress={() => router.push("/transactions/new")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[5] },
  hero: { gap: spacing[1] },
  negative: { color: colors.terracotta },
  groups: { gap: spacing[2] },
});
