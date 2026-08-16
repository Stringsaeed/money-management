import { FlashList } from "@shopify/flash-list";

import { JournalListItemRow } from "@/components/home/journal-list-item-row";
import type { HomeJournalListProps } from "@/components/home/types";
import { buildJournalList, type JournalListItem } from "@/utils/journal-list";

export function HomeJournalList({
  groups,
  currency,
  showAccount,
  ListHeaderComponent,
}: HomeJournalListProps) {
  const items = buildJournalList(groups, currency, showAccount);

  const renderItem = ({ item }: { item: JournalListItem }) => <JournalListItemRow item={item} />;

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
