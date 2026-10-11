import { router } from "expo-router";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { ListGroup, ListRow } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import type { UseDue } from "./use-due";

const noun = (count: number) => (count === 1 ? "bill" : "bills");

/** M1's way into the Due list: today's bills and anything overdue, or the next one coming. */
export function DueTodayRow({ due }: { readonly due: UseDue }) {
  const { count, totalMinor } = due.dueNow;
  if (!due.loaded) return null;
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
