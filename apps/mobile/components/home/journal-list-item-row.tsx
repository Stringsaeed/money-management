import { View } from "react-native";

import { JournalDayHeader } from "@/components/home/journal-day-header";
import { TransactionRow } from "@/components/transaction/transaction-row";
import type { JournalListItem } from "@/utils/journal-list";

interface JournalListItemRowProps {
  item: JournalListItem;
}

export function JournalListItemRow({ item }: JournalListItemRowProps) {
  if (item.type === "section-header") {
    return <JournalDayHeader item={item} />;
  }

  return (
    <View>
      <TransactionRow transaction={item.data} showAccount={item.showAccount} />
      {!item.isLast ? <View className="ml-16 h-px bg-ledger-outline" /> : null}
    </View>
  );
}
