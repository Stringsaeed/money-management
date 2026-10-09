import { ListGroup, SectionHeader, TransactionRow } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { GALLERY_CURRENCY } from "./sample-data";
import { noop } from "./utils";

export function TransactionsDemo() {
  return (
    <GalleryGroup label="SECTION HEADER + TRANSACTION ROWS">
      <SectionHeader currency={GALLERY_CURRENCY} title="Today" totalMinor={415780} />
      <ListGroup dividerInset={68}>
        <TransactionRow
          currency={GALLERY_CURRENCY}
          icon="groceries"
          minor={-6420}
          onPress={noop}
          subtitle="Groceries · 8:12 AM"
          title="Fresh Market"
        />
        <TransactionRow
          currency={GALLERY_CURRENCY}
          icon={"☕"}
          minor={-480}
          onPress={noop}
          subtitle="Dining · 7:45 AM"
          title="Blue Bottle Coffee"
        />
        <TransactionRow
          currency={GALLERY_CURRENCY}
          icon="salary"
          minor={420000}
          onPress={noop}
          subtitle="Income · 6:00 AM"
          title="Salary"
        />
      </ListGroup>
    </GalleryGroup>
  );
}
