import type { ReactNode } from "react";

import { Checkbox, ListRow } from "@/ui/trove";

interface ChoiceRowProps {
  readonly label: string;
  /** Quiet text before the end of the row, e.g. "AED 120 a month". */
  readonly detail?: string;
  /** Trailing content such as an `Amount`. */
  readonly trailing?: ReactNode;
  readonly note?: string;
  readonly ticked: boolean;
  /** Unavailable rows show their `note` and cannot be changed. */
  readonly disabled?: boolean;
  readonly onPress?: () => void;
}

/** A tick-box row used for funding accounts and the What it's for checklist. Sits in a ListGroup. */
export function ChoiceRow({
  label,
  detail,
  trailing,
  note,
  ticked,
  disabled = false,
  onPress,
}: ChoiceRowProps) {
  const toggle = disabled ? undefined : onPress;
  return (
    <ListRow
      accessibilityLabel={`${label}, ${ticked ? "ticked" : "not ticked"}`}
      leading={
        <Checkbox
          accessibilityLabel={label}
          checked={ticked}
          disabled={disabled}
          onCheckedChange={() => toggle?.()}
        />
      }
      onPress={toggle}
      subtitle={note}
      title={label}
      trailing={trailing}
      value={detail}
    />
  );
}
