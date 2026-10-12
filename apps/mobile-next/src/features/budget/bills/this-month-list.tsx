import { router } from "expo-router";

import type { V2Envelope } from "@trove/api/v2/contracts";

import { Text } from "@/ui/trove";

import { BillRow } from "./bill-row";
import type { BillRow as BillRowData } from "./bills-model";

interface ThisMonthListProps {
  readonly rows: readonly BillRowData[];
  readonly iconFor: (envelope: V2Envelope) => string;
  readonly currency: string;
  readonly today: string;
  /** Tops up a short bill by what it is short. Absent when the caller may not move money. */
  readonly onCover?: (envelopeId: string, shortMinor: number) => void;
}

/** B1 "This month": every Bills envelope as paid, ready, or short. */
export function ThisMonthList({ rows, iconFor, currency, today, onCover }: ThisMonthListProps) {
  if (rows.length === 0) {
    return (
      <Text variant="bodySm" tone="secondary">
        No bills in your plan yet.
      </Text>
    );
  }
  return rows.map((row) => {
    const { envelope } = row.line;
    const { status } = row;
    return (
      <BillRow
        key={envelope.id}
        row={row}
        icon={iconFor(envelope)}
        currency={currency}
        today={today}
        onPress={() =>
          router.push({ pathname: "/budget/envelope/[id]", params: { id: envelope.id } })
        }
        onCover={
          onCover && status.kind === "short"
            ? () => onCover(envelope.id, status.shortMinor)
            : undefined
        }
      />
    );
  });
}
