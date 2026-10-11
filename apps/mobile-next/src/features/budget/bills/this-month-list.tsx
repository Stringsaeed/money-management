import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";

import type { EnvelopeLine } from "../home/home-model";

import { BillRow } from "./bill-row";
import { billLines, billStatus } from "./bills-model";

interface ThisMonthListProps {
  readonly lines: readonly EnvelopeLine[];
  /**
   * Slot for Recurring due data (#372): what is still to pay this period per Bills envelope id.
   * Without an entry the bill is judged from its own plan and spending.
   */
  readonly dueMinorByEnvelopeId?: ReadonlyMap<string, number>;
  readonly onCover: (envelopeId: string) => void;
}

/** B1 "This month": every Bills envelope as paid, ready, or short. */
export function ThisMonthList({ lines, dueMinorByEnvelopeId, onCover }: ThisMonthListProps) {
  const bills = billLines(lines);
  if (bills.length === 0) {
    return <Text variant="caption">No bills in your plan yet.</Text>;
  }
  return (
    <View style={styles.list}>
      {bills.map((line) => (
        <BillRow
          key={line.envelope.id}
          line={line}
          status={billStatus(line.totals, dueMinorByEnvelopeId?.get(line.envelope.id))}
          onPress={() =>
            router.push({ pathname: "/budget/envelope/[id]", params: { id: line.envelope.id } })
          }
          onCover={() => onCover(line.envelope.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ list: { gap: spacing[2] } });
