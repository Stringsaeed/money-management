import type { V2EnvelopeGroup } from "@trove/api/v2/contracts";
import { ListGroup } from "@/ui/trove";

import { useBudgetMoney } from "../currency/use-budget-currency";
import type { EnvelopeLine } from "../home/home-model";

import { PlanEnvelopeRow } from "./plan-envelope-row";

const GROUPS: readonly { readonly group: V2EnvelopeGroup; readonly title: string }[] = [
  { group: "bills", title: "Bills" },
  { group: "everyday", title: "Everyday" },
  { group: "saving", title: "Saving for" },
];

/** Group totals planned this month, each envelope tappable to change its plan. */
export function PlanGroups({ lines }: { readonly lines: readonly EnvelopeLine[] }) {
  const money = useBudgetMoney();
  return GROUPS.map(({ group, title }) => {
    const inGroup = lines.filter((line) => line.envelope.group === group);
    if (inGroup.length === 0) return null;
    const planned = inGroup.reduce((total, line) => total + line.totals.plannedMinor, 0);
    return (
      <ListGroup key={group} dividerInset={0} header={`${title} · ${money(planned)}`}>
        {inGroup.map((line) => (
          <PlanEnvelopeRow key={line.envelope.id} line={line} />
        ))}
      </ListGroup>
    );
  });
}
