import { router } from "expo-router";

import type { V2Envelope } from "@trove/api/v2/contracts";

import { Text } from "@/ui/trove";

import type { SavingRow as SavingRowData } from "./bills-model";
import { SavingRow } from "./saving-row";

interface NextYearListProps {
  readonly rows: readonly SavingRowData[];
  readonly iconFor: (envelope: V2Envelope) => string;
  readonly currency: string;
  readonly today: string;
  /** Absent when the caller may not mark payments paid. */
  readonly onMarkPaid?: (envelopeId: string) => void;
}

/** B1 "Next 12 months": Saving-for envelopes, soonest due first. */
export function NextYearList({ rows, iconFor, currency, today, onMarkPaid }: NextYearListProps) {
  if (rows.length === 0) {
    return (
      <Text variant="bodySm" tone="secondary">
        Nothing big coming up. Add rent cheques, school terms or Ramadan and Eid to save for them a
        little each payday.
      </Text>
    );
  }
  return rows.map((row) => {
    const { envelope } = row.line;
    return (
      <SavingRow
        key={envelope.id}
        row={row}
        icon={iconFor(envelope)}
        currency={currency}
        today={today}
        onPress={() =>
          router.push({ pathname: "/budget/envelope/[id]", params: { id: envelope.id } })
        }
        onMarkPaid={onMarkPaid ? () => onMarkPaid(envelope.id) : undefined}
      />
    );
  });
}
