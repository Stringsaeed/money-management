import { StyleSheet, View } from "react-native";

import { type V2Account } from "@trove/api/v2/contracts";

import { CategoryTile, FlowButton, Text } from "@/ui/trove";

import { useBudgetCurrency } from "../currency/use-budget-currency";
import { PanelError } from "../envelope/panel-error";
import type { ActiveBudgetView, EnvelopeLine } from "../home/home-model";

import { MarkPaidFields } from "./mark-paid-fields";
import { markPaidStamp } from "./mark-paid-lines";
import { MarkPaidReceipt } from "./mark-paid-receipt";
import { SheetHeading } from "./sheet-heading";
import { useMarkPaidForm } from "./use-mark-paid-form";

interface MarkPaidFormProps {
  readonly view: ActiveBudgetView;
  readonly line: EnvelopeLine;
  /** The envelope's tile: its Category emoji or a Trove icon. */
  readonly icon: string;
  readonly accounts: readonly V2Account[];
  readonly onPaid: (amountMinor: number) => void;
  readonly onCancel: () => void;
}

/** B3: record that a big payment was made, from which account and on what day. */
export function MarkPaidForm({ view, line, icon, accounts, onPaid, onCancel }: MarkPaidFormProps) {
  const currency = useBudgetCurrency();
  const form = useMarkPaidForm({ view, line, accounts, onPaid });
  const { envelope, totals } = line;
  const dueNow = envelope.dueDate !== null && envelope.dueDate <= form.today;
  const canPay = form.funding.length > 0;
  return (
    <View style={styles.container}>
      <SheetHeading
        leading={<CategoryTile icon={icon} round />}
        size={24}
        stamp={markPaidStamp(envelope.dueDate, form.today)}
        stampTone={dueNow ? "warning" : "tertiary"}
        title={`${envelope.name} paid?`}
      />
      <MarkPaidFields form={form} currency={currency} />
      <View accessibilityLiveRegion="polite">
        <MarkPaidReceipt
          amountMinor={form.amountMinor}
          currency={currency}
          envelope={envelope}
          leftMinor={totals.leftMinor}
        />
      </View>
      {form.problem && canPay ? (
        <Text accessibilityRole="alert" tone="warning" variant="bodySm">
          {form.problem}
        </Text>
      ) : null}
      <PanelError message={form.error} />
      <View style={styles.actions}>
        <FlowButton
          label="Not yet"
          onPress={onCancel}
          size="cta"
          style={styles.secondary}
          tone="outline"
        />
        <FlowButton
          disabled={form.problem !== "" || !canPay}
          label="Confirm paid"
          loading={form.busy}
          onPress={() => void form.submit()}
          size="cta"
          style={styles.primary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Sheet content already pads 8 top / 24 bottom; the board sheet pads 20 / 34.
  container: { gap: 14, paddingBottom: 10, paddingTop: 12 },
  actions: { flexDirection: "row", gap: 10 },
  secondary: { flex: 1 },
  primary: { flex: 1.4 },
});
