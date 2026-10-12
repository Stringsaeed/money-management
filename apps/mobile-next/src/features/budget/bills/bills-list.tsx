import { StyleSheet, View } from "react-native";

import { Text } from "@/ui/trove";

import { PLAN_ADMIN_ONLY } from "../role/budget-role";

import { AddBigPaymentButton } from "./add-big-payment-button";
import type { BillsTab } from "./bills-tab";
import { NextYearList } from "./next-year-list";
import { ThisMonthList } from "./this-month-list";
import type { useBills } from "./use-bills";

interface BillsListProps {
  readonly tab: BillsTab;
  readonly bills: ReturnType<typeof useBills>;
  /** Absent when the person may not change the plan: an admin-only line shows instead. */
  readonly onAdd?: () => void;
  readonly onCover?: (envelopeId: string, shortMinor: number) => void;
  readonly onMarkPaid?: (envelopeId: string) => void;
}

/** The tab's rows and, under them, Add a big payment. */
export function BillsList({ tab, bills, onAdd, onCover, onMarkPaid }: BillsListProps) {
  const shared = { iconFor: bills.iconFor, currency: bills.currency, today: bills.today };
  return (
    <View>
      {tab === "month" ? (
        <ThisMonthList {...shared} rows={bills.bills} onCover={onCover} />
      ) : (
        <NextYearList {...shared} rows={bills.savings} onMarkPaid={onMarkPaid} />
      )}
      {onAdd ? (
        <AddBigPaymentButton onPress={onAdd} />
      ) : (
        <Text tone="secondary" variant="bodySm" style={styles.adminOnly}>
          {PLAN_ADMIN_ONLY}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ adminOnly: { marginTop: 14 } });
