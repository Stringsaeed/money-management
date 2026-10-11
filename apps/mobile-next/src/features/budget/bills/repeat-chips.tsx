import type { V2EnvelopeRepeat } from "@trove/api/v2/contracts";

import { Chip } from "@/ui/trove";

import { ChipRow } from "../quick-add/chip-row";

import { REPEAT_LABELS, REPEAT_OPTIONS } from "./big-payment-model";

interface RepeatChipsProps {
  readonly value: V2EnvelopeRepeat;
  readonly onChange: (value: V2EnvelopeRepeat) => void;
}

/** Once, every 3 months, every 6 months, or yearly. */
export function RepeatChips({ value, onChange }: RepeatChipsProps) {
  return (
    <ChipRow label="Repeats">
      {REPEAT_OPTIONS.map((option) => (
        <Chip
          key={option}
          label={REPEAT_LABELS[option]}
          selected={option === value}
          onPress={() => onChange(option)}
        />
      ))}
    </ChipRow>
  );
}
