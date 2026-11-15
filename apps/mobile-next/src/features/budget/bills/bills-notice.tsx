import { View } from "react-native";

import { Banner } from "@/ui/trove";

import type { BillsTab } from "./bills-tab";
import { SavingAttention } from "./saving-attention";
import type { useBills } from "./use-bills";

interface BillsNoticeProps {
  readonly tab: BillsTab;
  readonly bills: ReturnType<typeof useBills>;
  readonly canEditPlan: boolean;
  readonly onCover?: (envelopeId: string, shortMinor: number) => void;
}

/** What sits over the rows: the Due list failing on This month, a big payment needing you on the year. */
export function BillsNotice({ tab, bills, canEditPlan, onCover }: BillsNoticeProps) {
  if (tab === "month") {
    if (!bills.due.isError) return null;
    return (
      <View accessibilityRole="alert">
        <Banner
          actionLabel="Retry"
          message="Short shows only for overspent bills until they load."
          onAction={() => void bills.due.retry()}
          title="Couldn't load bills due"
          tone="negative"
        />
      </View>
    );
  }
  const row = bills.attention;
  if (!row) return null;
  return (
    <SavingAttention
      key={row.line.envelope.id}
      row={row}
      currency={bills.currency}
      today={bills.today}
      emoji={bills.emojiFor(row.line.envelope)}
      canEditPlan={canEditPlan}
      onCover={onCover}
    />
  );
}
