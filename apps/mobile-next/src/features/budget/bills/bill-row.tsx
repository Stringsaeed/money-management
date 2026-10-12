import { BudgetPill } from "@/ui/trove";

import { billMeta, billPill, plainFigure } from "./bills-copy";
import type { BillRow as BillRowData } from "./bills-model";
import { PaymentRow } from "./payment-row";

interface BillRowProps {
  readonly row: BillRowData;
  readonly icon: string;
  readonly currency: string;
  readonly today: string;
  readonly onPress: () => void;
  /** Tops up a short bill; absent when it is not short or the person may not move money. */
  readonly onCover?: () => void;
}

/** One Bills envelope: what it costs this month and whether it is paid, ready, or short. */
export function BillRow({ row, icon, currency, today, onPress, onCover }: BillRowProps) {
  const meta = billMeta(row, today, currency);
  const pill = billPill(row, currency);
  const amount = plainFigure(row.amountMinor, currency);
  const label = [
    row.line.envelope.name,
    pill.spoken ?? pill.label,
    `${amount} ${currency}`,
    meta.toLowerCase(),
  ].join(", ");
  return (
    <PaymentRow
      accessibilityLabel={label}
      amount={amount}
      icon={icon}
      meta={meta}
      name={row.line.envelope.name}
      onPress={onPress}
      pill={pill}
    >
      {onCover && row.status.kind === "short" ? (
        <BudgetPill label="Cover it" onPress={onCover} size="sm" tone="warn" />
      ) : null}
    </PaymentRow>
  );
}
