import { View } from "react-native";
import { FlashList } from "@shopify/flash-list";

import { TransactionRow } from "@/components/transaction/transaction-row";
import { buildJournalList, type JournalListItem } from "@/utils/journal-list";

import { JournalDayHeader } from "./journal-day-header";
import type { HomeJournalListProps } from "./types";

export function HomeJournalList({
  groups,
  currency,
  showAccount,
  ListHeaderComponent,
}: HomeJournalListProps) {
  const items = buildJournalList(groups, currency, showAccount);

  const renderItem = ({ item }: { item: JournalListItem }) => {
    if (item.type === "section-header") {
      return <JournalDayHeader item={item} />;
    }

    return (
      <View>
        <TransactionRow transaction={item.data} showAccount={item.showAccount} />
        {!item.isLast && <View className="ml-16 h-px bg-ledger-outline" />}
      </View>
    );
  };

  const getItemType = (item: JournalListItem) => item.type;

  const keyExtractor = (item: JournalListItem) =>
    item.type === "section-header" ? `header-${item.date}` : `tx-${item.data.id}`;

  return (
    <FlashList
      data={items}
      renderItem={renderItem}
      getItemType={getItemType}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={{ paddingBottom: 112 }}
    />
  );
}
