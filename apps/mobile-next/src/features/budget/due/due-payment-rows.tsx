import { Fragment } from "react";
import { StyleSheet, View } from "react-native";

import { colors, DashedRule, radius } from "@/ui/trove";

import { DuePaymentRow, type DuePaymentField } from "./due-payment-row";

interface DuePaymentRowsProps {
  readonly fields: readonly DuePaymentField[];
  readonly onChange?: () => void;
}

/** The paper block of a bill due now: AMOUNT, FROM, DATE, split by dashed rules. */
export function DuePaymentRows({ fields, onChange }: DuePaymentRowsProps) {
  return (
    <View style={styles.paper}>
      {fields.map((field, index) => (
        <Fragment key={field.label}>
          {index > 0 ? <DashedRule /> : null}
          <DuePaymentRow field={field} onPress={onChange} />
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: colors.surface.paper,
    borderCurve: "continuous",
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
});
