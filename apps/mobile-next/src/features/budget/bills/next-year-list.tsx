import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { space, Text } from "@/ui/trove";

import type { EnvelopeLine } from "../home/home-model";

import { savingRows } from "./bills-model";
import { SavingRow } from "./saving-row";

interface NextYearListProps {
  readonly lines: readonly EnvelopeLine[];
  readonly onMarkPaid: (envelopeId: string) => void;
}

/** B1 "Next 12 months": Saving-for envelopes, soonest due first. */
export function NextYearList({ lines, onMarkPaid }: NextYearListProps) {
  const rows = savingRows(lines);
  if (rows.length === 0) {
    return (
      <Text variant="bodySm" tone="secondary">
        Nothing big coming up. Add rent cheques, school terms or Ramadan and Eid to save for them a
        little each payday.
      </Text>
    );
  }
  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <SavingRow
          key={row.line.envelope.id}
          row={row}
          onPress={() =>
            router.push({
              pathname: "/budget/envelope/[id]",
              params: { id: row.line.envelope.id },
            })
          }
          onMarkPaid={() => onMarkPaid(row.line.envelope.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ list: { gap: space[2] } });
