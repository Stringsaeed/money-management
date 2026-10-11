import { Chip } from "@/ui/chip";

import { ChipRow } from "../quick-add/chip-row";

import type { Place } from "./cover-move-model";

interface PlaceChipsProps {
  readonly label: string;
  readonly places: readonly Place[];
  readonly selectedKey: string | null;
  readonly onSelect: (key: string) => void;
}

/** Pick one place (Not planned yet or an envelope) from a sideways row. */
export function PlaceChips({ label, places, selectedKey, onSelect }: PlaceChipsProps) {
  return (
    <ChipRow label={label}>
      {places.map((place) => (
        <Chip
          key={place.key}
          label={place.name}
          selected={place.key === selectedKey}
          onPress={() => onSelect(place.key)}
        />
      ))}
    </ChipRow>
  );
}
