import { StyleSheet, View, type TextInput } from "react-native";

import type { V2EnvelopeGroup } from "@trove/api/v2/contracts";

import { PlanAmountRow } from "@/ui/trove";

import { SectionStamp } from "./section-stamp";
import { GROUP_LABELS } from "./setup-types";

export interface AmountRowModel {
  readonly key: string;
  readonly emoji: string;
  readonly name: string;
  readonly hint?: string;
  readonly value: string;
}

interface AmountGroupProps {
  readonly group: V2EnvelopeGroup;
  /** The group's planned total, e.g. "4,675". */
  readonly total: string;
  readonly currency: string;
  readonly rows: readonly AmountRowModel[];
  readonly onChange: (key: string, text: string) => void;
  /** Registers each row's input so the done bar's arrows can walk every row in order. */
  readonly fieldRef: (key: string) => (input: TextInput | null) => void;
  readonly onPrevious: (key: string) => (() => void) | undefined;
  readonly onNext: (key: string) => (() => void) | undefined;
}

/** One group of Plan amounts: the stamp with the group total, then an amount row per envelope. */
export function AmountGroup({
  group,
  total,
  currency,
  rows,
  onChange,
  fieldRef,
  onPrevious,
  onNext,
}: AmountGroupProps) {
  return (
    <View>
      <View style={styles.heading}>
        <SectionStamp label={GROUP_LABELS[group].toUpperCase()} trailing={total} />
      </View>
      {rows.map((row) => (
        <PlanAmountRow
          key={row.key}
          ref={fieldRef(row.key)}
          currency={currency}
          emoji={row.emoji}
          hint={row.hint}
          name={row.name}
          value={row.value}
          onChangeText={(text) => onChange(row.key, text)}
          onPreviousField={onPrevious(row.key)}
          onNextField={onNext(row.key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { marginVertical: 2 },
});
