import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { ListRow } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import type { GroupSummary } from "./home-model";

interface GroupSummaryRowProps {
  readonly title: string;
  readonly noun: { readonly one: string; readonly many: string };
  /** What "left" means for this group, e.g. "left" for bills or "set aside" for saving. */
  readonly leftLabel: string;
  readonly summary: GroupSummary;
  readonly onPress: () => void;
}

/** Bills and Saving-for summary: count and totals. Tapping opens Bills & big payments. */
export function GroupSummaryRow({
  title,
  noun,
  leftLabel,
  summary,
  onPress,
}: GroupSummaryRowProps) {
  const count = `${summary.count} ${summary.count === 1 ? noun.one : noun.many}`;
  const detail =
    summary.count === 0
      ? "None yet"
      : `${count} · ${formatMoneyMinor(summary.leftMinor, BUDGET_CURRENCY)} ${leftLabel}`;
  return (
    <ListRow
      accessibilityLabel={`${title}, ${detail}`}
      chevron
      onPress={onPress}
      subtitle={detail}
      title={title}
    />
  );
}
