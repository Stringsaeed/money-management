import { router } from "expo-router";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { ListGroup, ListRow } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import type { UseDue } from "./use-due";

const noun = (count: number) => (count === 1 ? "bill" : "bills");

/**
 * M1's way into the Due list: today's bills and anything overdue, or the next one coming. While
 * the bills load, or when they fail to, it says so rather than disappearing as if nothing is due.
 */
export function DueTodayRow({ due }: { readonly due: UseDue }) {
  if (due.isError) {
    return (
      <ListGroup dividerInset={0}>
        <ListRow
          accessibilityLabel="Due today, couldn't load your bills. Retry"
          onPress={() => void due.retry()}
          subtitle="Couldn't load your bills · Retry"
          title="Due today"
        />
      </ListGroup>
    );
  }
  if (!due.loaded) {
    return (
      <ListGroup dividerInset={0}>
        <ListRow subtitle="Checking your bills…" title="Due today" />
      </ListGroup>
    );
  }
  const { count, totalMinor } = due.dueNow;
  const next = due.sections.flatMap((section) => section.items)[0];
  if (count === 0 && !next) return null;

  const detail =
    count > 0
      ? `${count} ${noun(count)} · ${formatMoneyMinor(totalMinor, BUDGET_CURRENCY)}`
      : `Nothing today. Next: ${next?.name ?? ""}`;
  return (
    <ListGroup dividerInset={0}>
      <ListRow
        accessibilityLabel={`Due today, ${detail}`}
        chevron
        onPress={() => router.push("/budget/due")}
        subtitle={detail}
        title="Due today"
      />
    </ListGroup>
  );
}
