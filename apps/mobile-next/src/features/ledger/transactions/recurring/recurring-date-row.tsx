import { useState } from "react";

import { DateSheet, ListRow } from "@/ui/trove";

import { formatRecurringDate } from "./recurring-dates";

interface RecurringDateRowProps {
  readonly title: string;
  /** `yyyy-MM-dd`, or "" while no date is chosen (the end date is optional). */
  readonly value: string;
  /** Date the sheet opens on while `value` is empty. */
  readonly fallback: string;
  readonly emptyLabel?: string;
  readonly onChange: (dateKey: string) => void;
}

/** Date trigger row that opens the Trove date sheet; shows `emptyLabel` until a date is set. */
export function RecurringDateRow({
  title,
  value,
  fallback,
  emptyLabel = "Choose",
  onChange,
}: RecurringDateRowProps) {
  const [open, setOpen] = useState(false);
  const shown = value ? formatRecurringDate(value) : emptyLabel;

  return (
    <>
      <ListRow
        icon="calendar"
        title={title}
        value={shown}
        chevron
        accessibilityLabel={`${title}, ${shown}`}
        onPress={() => setOpen(true)}
      />
      <DateSheet
        open={open}
        onDismiss={() => setOpen(false)}
        title={title}
        value={value || fallback}
        onChange={onChange}
      />
    </>
  );
}
