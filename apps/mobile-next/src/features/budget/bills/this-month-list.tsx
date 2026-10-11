import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { space, Text } from "@/ui/trove";

import type { EnvelopeLine } from "../home/home-model";

import { BillRow } from "./bill-row";
import { billLines, billStatus } from "./bills-model";

interface ThisMonthListProps {
  readonly lines: readonly EnvelopeLine[];
  /**
   * What is still to pay this period per Bills envelope id (`dueByEnvelope`). Without an entry
   * the bill is judged from its own plan and spending.
   */
  readonly dueMinorByEnvelopeId?: ReadonlyMap<string, number>;
  /** Tops up a short bill by what it is short. Absent when the caller may not move money. */
  readonly onCover?: (envelopeId: string, shortMinor: number) => void;
}

/** B1 "This month": every Bills envelope as paid, ready, or short. */
export function ThisMonthList({ lines, dueMinorByEnvelopeId, onCover }: ThisMonthListProps) {
  const bills = billLines(lines);
  if (bills.length === 0) {
    return (
      <Text variant="bodySm" tone="secondary">
        No bills in your plan yet.
      </Text>
    );
  }
  return (
    <View style={styles.list}>
      {bills.map((line) => {
        const status = billStatus(line.totals, dueMinorByEnvelopeId?.get(line.envelope.id));
        return (
          <BillRow
            key={line.envelope.id}
            line={line}
            status={status}
            onPress={() =>
              router.push({ pathname: "/budget/envelope/[id]", params: { id: line.envelope.id } })
            }
            onCover={
              onCover && status.kind === "short"
                ? () => onCover(line.envelope.id, status.shortMinor)
                : undefined
            }
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ list: { gap: space[2] } });
