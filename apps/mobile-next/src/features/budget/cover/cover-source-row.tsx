import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { ListRow } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import type { CoverTake, Place } from "./cover-move-model";

interface CoverSourceRowProps {
  readonly place: Place;
  readonly selected: boolean;
  /** What this source gives and has left afterwards; only when it is part of the cover. */
  readonly take: CoverTake | undefined;
  readonly onToggle: () => void;
}

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** One place a cover can come from, with its Left and the "After:" preview. Sits in a ListGroup. */
export function CoverSourceRow({ place, selected, take, onToggle }: CoverSourceRowProps) {
  const left =
    place.kind === "unplanned"
      ? `${money(place.availableMinor)} not planned`
      : `${money(place.availableMinor)} left`;
  const after = take
    ? `After: ${money(take.afterMinor)}${place.kind === "unplanned" ? " not planned" : " left"}`
    : null;
  const detail = place.kind === "saving" ? `savings · ${left}` : left;
  return (
    <ListRow
      accessibilityLabel={`${place.name}${place.kind === "saving" ? ", savings" : ""}, ${left}${after ? `. ${after}` : ""}`}
      checked={selected}
      onPress={onToggle}
      subtitle={after ? `${detail}\n${after}` : detail}
      title={place.name}
    />
  );
}
